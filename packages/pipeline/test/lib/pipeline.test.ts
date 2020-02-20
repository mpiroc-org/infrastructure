import { expect as expectCDK, haveResourceLike } from '@aws-cdk/assert'
import * as cdk from '@aws-cdk/core'
import { Pipeline } from '../../lib'

describe(`Pipeline`, () => {
    let stack: cdk.Stack

    const PIPELINE_OWNER: string = `MyPipelineOwner`
    const PIPELINE_REPO: string = `MyPipelineRepo`
    const PIPELINE_BRANCH: string = `MyPipelineBranch`
    const PIPELINE_NAME: string = `MyPipelineName`
    const PARAMETER_NAME: string = `/github/mpiroc-org/ci`
    const PARAMETER_VERSION: number = 1

    beforeEach(async () => {
        stack = new cdk.Stack(new cdk.App(), `TestStack`)
        /* eslint-disable no-new */
        await Pipeline.create(stack, `pipeline`, {
            owner: PIPELINE_OWNER,
            repo: PIPELINE_REPO,
            branches: [PIPELINE_BRANCH],
            name: PIPELINE_NAME,
            secureStringParameters: [{
                parameterName: PARAMETER_NAME,
                version: PARAMETER_VERSION
            }]
        })
        /* eslint-enable no-new */
    })

    describe(`role`, () => {
        it(`exists`, () => {
            expectCDK(stack).to(haveResourceLike(`AWS::IAM::Role`))
        })

        it(`has expected policy`, () => {
            expectCDK(stack).to(haveResourceLike(`AWS::IAM::Role`, {
                AssumeRolePolicyDocument: {
                    Statement: [
                        {
                            Action: `sts:AssumeRole`,
                            Effect: `Allow`,
                            Principal: {
                                Service: `codebuild.amazonaws.com`
                            }
                        }
                    ],
                    Version: `2012-10-17`
                }
            }))
        })
    })

    describe(`policy`, () => {
        it(`exists`, () => {
            expectCDK(stack).to(haveResourceLike(`AWS::IAM::Policy`))
        })

        it(`has expected policy document`, () => {
            expectCDK(stack).to(haveResourceLike(`AWS::IAM::Policy`, {
                PolicyDocument: {
                    Statement: [
                        {
                            Action: [
                                `logs:CreateLogGroup`,
                                `logs:CreateLogStream`,
                                `logs:PutLogEvents`
                            ],
                            Effect: `Allow`,
                            Resource: [
                                {
                                    'Fn::Join': [
                                        ``,
                                        [
                                            `arn:`,
                                            {
                                                Ref: `AWS::Partition`
                                            },
                                            `:logs:`,
                                            {
                                                Ref: `AWS::Region`
                                            },
                                            `:`,
                                            {
                                                Ref: `AWS::AccountId`
                                            },
                                            `:log-group:/aws/codebuild/`,
                                            {
                                                Ref: `pipeline${PIPELINE_NAME}93E141E1`
                                            }
                                        ]
                                    ]
                                },
                                {
                                    'Fn::Join': [
                                        ``,
                                        [
                                            `arn:`,
                                            {
                                                Ref: `AWS::Partition`
                                            },
                                            `:logs:`,
                                            {
                                                Ref: `AWS::Region`
                                            },
                                            `:`,
                                            {
                                                Ref: `AWS::AccountId`
                                            },
                                            `:log-group:/aws/codebuild/`,
                                            {
                                                Ref: `pipeline${PIPELINE_NAME}93E141E1`
                                            },
                                            `:*`
                                        ]
                                    ]
                                }
                            ]
                        },
                        {
                            Action: [
                                `kms:Decrypt`,
                                `kms:DescribeKey`
                            ],
                            Effect: `Allow`,
                            Resource: `arn:aws:kms:us-east-1:257848698535:key/027ebae8-de63-438f-beb2-78feddd5b013`
                        },
                        {
                            Action: [
                                `ssm:DescribeParameters`,
                                `ssm:GetParameters`,
                                `ssm:GetParameter`,
                                `ssm:GetParameterHistory`
                            ],
                            Effect: `Allow`,
                            Resource: {
                                'Fn::Join': [
                                    ``,
                                    [
                                        `arn:`,
                                        { Ref: `AWS::Partition` },
                                        `:ssm:`,
                                        { Ref: `AWS::Region` },
                                        `:`,
                                        { Ref: `AWS::AccountId` },
                                        `:parameter/github/mpiroc-org/ci`
                                    ]
                                ]
                            }
                        }
                    ],
                    Version: `2012-10-17`
                }
            }))
        })
    })

    describe(`project`, () => {
        it(`exists`, () => {
            expectCDK(stack).to(haveResourceLike(`AWS::CodeBuild::Project`))
        })

        it(`has no artifacts`, () => {
            expectCDK(stack).to(haveResourceLike(`AWS::CodeBuild::Project`, {
                Artifacts: {
                    Type: `NO_ARTIFACTS`
                }
            }))
        })

        it(`has expected environment`, () => {
            expectCDK(stack).to(haveResourceLike(`AWS::CodeBuild::Project`, {
                Environment: {
                    ComputeType: `BUILD_GENERAL1_SMALL`,
                    Image: `aws/codebuild/standard:3.0`,
                    PrivilegedMode: false,
                    Type: `LINUX_CONTAINER`
                }
            }))
        })

        it(`has service role`, () => {
            expectCDK(stack).to(haveResourceLike(`AWS::CodeBuild::Project`, {
                ServiceRole: {}
            }))
        })

        it(`has expected GitHub repository as its source`, () => {
            expectCDK(stack).to(haveResourceLike(`AWS::CodeBuild::Project`, {
                Source: {
                    Location: `https://github.com/${PIPELINE_OWNER}/${PIPELINE_REPO}.git`,
                    ReportBuildStatus: true,
                    Type: `GITHUB`
                }
            }))
        })

        it(`has badge enabled`, () => {
            expectCDK(stack).to(haveResourceLike(`AWS::CodeBuild::Project`, {
                BadgeEnabled: true
            }))
        })

        it(`has expected name`, () => {
            expectCDK(stack).to(haveResourceLike(`AWS::CodeBuild::Project`, {
                Name: PIPELINE_NAME
            }))
        })

        it(`has expected triggers`, () => {
            expectCDK(stack).to(haveResourceLike(`AWS::CodeBuild::Project`, {
                Triggers: {
                    FilterGroups: [
                        [
                            {
                                Pattern: `PUSH`,
                                Type: `EVENT`
                            },
                            {
                                Pattern: `refs/heads/${PIPELINE_BRANCH}`,
                                Type: `HEAD_REF`
                            }
                        ]
                    ],
                    Webhook: true
                }
            }))
        })
    })
})