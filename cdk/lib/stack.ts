import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigw from 'aws-cdk-lib/aws-apigateway'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as wafv2 from 'aws-cdk-lib/aws-wafv2'

export class CaptionArtStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    })

    const uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [{ expiration: Duration.hours(48) }],
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    })

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new cloudfrontOrigins.S3Origin(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
    })

    const nodeLambdaDefaults: { runtime: lambda.Runtime; architecture: lambda.Architecture; memorySize: number; timeout: Duration } = {
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 512,
      timeout: Duration.seconds(30),
    }

    const env = {
      UPLOAD_BUCKET: uploadsBucket.bucketName,
      SSM_REPLICATE_TOKEN_NAME: process.env.SSM_REPLICATE_TOKEN_NAME || '/caption-art/REPLICATE_API_TOKEN',
      SSM_OPENAI_KEY_NAME: process.env.SSM_OPENAI_KEY_NAME || '/caption-art/OPENAI_API_KEY',
      SSM_GUMROAD_PERMALINK: process.env.SSM_GUMROAD_PERMALINK || '/caption-art/GUMROAD_PRODUCT_PERMALINK',
      SSM_GUMROAD_ACCESS: process.env.SSM_GUMROAD_ACCESS || '/caption-art/GUMROAD_ACCESS_TOKEN',
    }

    const captionFn = new lambda.Function(this, 'CaptionFn', {
      ...nodeLambdaDefaults,
      handler: 'caption.handler',
      code: lambda.Code.fromAsset('../lambdas/dist'),
      environment: env,
    })

    const maskFn = new lambda.Function(this, 'MaskFn', {
      ...nodeLambdaDefaults,
      handler: 'mask.handler',
      code: lambda.Code.fromAsset('../lambdas/dist'),
      environment: env,
    })

    const verifyFn = new lambda.Function(this, 'VerifyFn', {
      ...nodeLambdaDefaults,
      handler: 'verify.handler',
      code: lambda.Code.fromAsset('../lambdas/dist'),
      environment: env,
    })

    const presignFn = new lambda.Function(this, 'PresignFn', {
      ...nodeLambdaDefaults,
      handler: 'presign.handler',
      code: lambda.Code.fromAsset('../lambdas/dist'),
      environment: env,
    })

    uploadsBucket.grantReadWrite(presignFn)
    uploadsBucket.grantRead(captionFn)
    uploadsBucket.grantRead(maskFn)

    const ssmPolicy = new iam.PolicyStatement({
      actions: ['ssm:GetParameter'],
      resources: ['*']
    })
    captionFn.addToRolePolicy(ssmPolicy)
    maskFn.addToRolePolicy(ssmPolicy)
    verifyFn.addToRolePolicy(ssmPolicy)

    const api = new apigw.RestApi(this, 'Api', {
      deployOptions: { stageName: 'prod', throttlingRateLimit: 10, throttlingBurstLimit: 20 }
    })

    api.root.addResource('caption').addMethod('POST', new apigw.LambdaIntegration(captionFn))
    api.root.addResource('mask').addMethod('POST', new apigw.LambdaIntegration(maskFn))
    api.root.addResource('verify').addMethod('POST', new apigw.LambdaIntegration(verifyFn))
    api.root.addResource('presign').addMethod('POST', new apigw.LambdaIntegration(presignFn))

    new wafv2.CfnWebACLAssociation(this, 'ApiWafAssoc', {
      resourceArn: api.deploymentStage.stageArn,
      webAclArn: (process.env.WAF_ACL_ARN || '').toString(),
    })

    new s3deploy.BucketDeployment(this, 'DeploySite', {
      sources: [s3deploy.Source.asset('../frontend/dist')],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*']
    })
  }
}
