import * as AWS from 'aws-sdk'
import { env, utils } from 'decentraland-commons'

console.log({
  accessKeyId: env.get('AWS_ACCESS_KEY'),
  secretAccessKey: env.get('AWS_ACCESS_SECRET')
})
export const s3 = new AWS.S3({
  accessKeyId: env.get('AWS_ACCESS_KEY'),
  secretAccessKey: env.get('AWS_ACCESS_SECRET')
})

export async function checkFile(
  bucketName: string,
  key: string
): Promise<boolean> {
  const params = {
    Bucket: bucketName,
    Key: key
  }
  const headObject = utils.promisify<boolean>(s3.headObject.bind(s3))
  try {
    await headObject(params)
    return true
  } catch (error) {
    if (error.code === 'NotFound') {
      return false
    }
    throw error
  }
}

export function uploadFile(
  bucketName: string,
  key: string,
  data: Buffer
): Promise<AWS.S3.ManagedUpload> {
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: data,
    ACL: 'public-read'
  }
  const upload = utils.promisify<AWS.S3.ManagedUpload>(s3.upload.bind(s3))
  return upload(params)
}
