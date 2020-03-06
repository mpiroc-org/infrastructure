#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from '@aws-cdk/core'
import { Pipeline } from '@mpiroc-org/pipeline'

async function main(): Promise<void> {
    const repos: string[] = [
        `config`,
        `infrastructure`,
        `tools`,
        `utils`
    ]
    
    const app: cdk.App = new cdk.App()
    const stack: cdk.Stack = new cdk.Stack(app, `deployment`)
    
    await Promise.all(repos.map(async repo => await Pipeline.create(
        stack,
        repo,
        {
            owner: `mpiroc-org`,
            repo,
            branches: [
                `master`,
                `develop`
            ],
            name: repo,
            stringParameters: [
                { parameterName: `/github/mpiroc-org/scope` },
                { parameterName: `/github/registry` }
            ],
            secureStringParameters: [{
                parameterName: `/github/mpiroc-org/ci`,
                version: 2
            }]
        }
    )))
}

/* eslint-disable @typescript-eslint/no-floating-promises */
main()
/* eslint-enable @typescript-eslint/no-floating-promises */
