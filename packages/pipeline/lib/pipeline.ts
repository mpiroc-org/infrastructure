import * as cdk from '@aws-cdk/core'
import * as codebuild from '@aws-cdk/aws-codebuild'
import * as kms from '@aws-cdk/aws-kms'
import * as ssm from '@aws-cdk/aws-ssm'
import { KMS, config } from 'aws-sdk'

const DEFAULT_REGION: string = `us-east-1`
config.region = DEFAULT_REGION

/* eslint-disable no-new */

/**
 * @alpha
 */
export interface IPipelineProps {
    owner: string
    repo: string
    branches: string[]
    name: string
    stringParameters?: ssm.StringParameterAttributes[]
    secureStringParameters?: ssm.SecureStringParameterAttributes[]
}

function buildBranchFilterGroup(branch: string): codebuild.FilterGroup {
    return codebuild.FilterGroup
        .inEventOf(codebuild.EventAction.PUSH)
        .andBranchIs(branch)
}

/**
 * @alpha
 */
export class Pipeline extends cdk.Construct {
    private static _defaultKeyArnPromise: Promise<string> | undefined
    
    private constructor(
        scope: cdk.Construct,
        id: string,
        {
            owner,
            repo,
            branches,
            name,
            stringParameters = [],
            secureStringParameters = [],
            defaultKey
        }: IPipelineProps & { defaultKey: kms.IKey }
    ) {
        super(scope, id)

        const source: codebuild.ISource = codebuild.Source.gitHub({
            owner,
            repo,
            webhookFilters: branches.map(buildBranchFilterGroup)
        })

        const project: codebuild.Project = new codebuild.Project(this, name, {
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_3_0
            },
            projectName: name,
            badge: true,
            source
        })

        if (!project.role) {
            throw new Error(`Cannot grant secret access to a CodeBuild project without a role.`)
        }

        for (const secureStringParameter of secureStringParameters) {
            const key: kms.IKey = secureStringParameter.encryptionKey ?? defaultKey
            key.grant(project.role, `kms:Decrypt`, `kms:DescribeKey`)
        }

        const parameters: ssm.IParameter[] = this._resolveParameters(stringParameters, secureStringParameters)
        for (const parameter of parameters) {
            parameter.grantRead(project.role)
        }
    }

    private _resolveParameters(
        stringParameters: ssm.StringParameterAttributes[] = [],
        secureStringParameters: ssm.SecureStringParameterAttributes[] = []
    ): ssm.IParameter[] {
        return stringParameters.map(p => ssm.StringParameter.fromStringParameterAttributes(this, p.parameterName, p)).concat(
            secureStringParameters.map(p => ssm.StringParameter.fromSecureStringParameterAttributes(this, p.parameterName, p))
        )
    }

    private static async _getDefaultKeyArn(): Promise<string> {
        const client: KMS = new KMS()
        const key: KMS.DescribeKeyResponse = await client.describeKey({ KeyId: `alias/aws/ssm` }).promise()
        const keyArn: string | undefined = key.KeyMetadata?.Arn
        if (!keyArn) {
            throw new Error(`Could not get ARN for key 'alias/aws/ssm'`)
        }

        return keyArn
    }

    public static async create(
        scope: cdk.Construct,
        id: string,
        props: IPipelineProps,
        defaultKeyArnOverride: string | undefined = undefined
    ): Promise<Pipeline> {
        let defaultKeyArn: string
        if (defaultKeyArnOverride) {
            defaultKeyArn = defaultKeyArnOverride
        } else {
            if (!Pipeline._defaultKeyArnPromise) {
                Pipeline._defaultKeyArnPromise = Pipeline._getDefaultKeyArn()
            }

            defaultKeyArn = await Pipeline._defaultKeyArnPromise
        }

        const defaultKey: kms.IKey = kms.Key.fromKeyArn(scope, `DefaultKey`, defaultKeyArn)

        return new Pipeline(scope, id, {
            ...props,
            defaultKey
        })
    }
}

/* eslint-enable no-new */
