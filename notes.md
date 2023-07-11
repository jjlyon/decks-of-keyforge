# basic
Install the following:
- java-17
- node v18.16.0 and npm 9.5.1 (ideally just get nvm and let that manage node/npm versions)

Make gradlew executable: `chmod +x gradlew`

## db
need to set up postgres running on default port (5432)
### docker method
```
docker run --name keyswapdb -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
docker exec -it keyswapdb psql -U postgres
CREATE DATABASE keyswap;
exit
```

## s3 bucket
### jj method

1. make user in AWS IAM service 
   1. make inline policy permitting basic s3 access
   ```
   {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "VisualEditor0",
                "Effect": "Allow",
                "Action": "s3:ListBucket",
                "Resource": "arn:aws:s3:::*"
            },
            {
                "Sid": "VisualEditor1",
                "Effect": "Allow",
                "Action": [
                    "s3:GetAccessPoint",
                    "s3:ListAllMyBuckets",
                    "s3:ListAccessPoints",
                    "s3:ListMultiRegionAccessPoints"
                ],
                "Resource": "*"
            }
        ]
    }
   ```
   2. make an api token for user
2. make s3 bucket (all default settings)
   1. make object (just a folder called decks-of-keyforge will do, perhaps not necessary, but I think I was running into problems without anything in there)
   2. make access point - just a name, internet access, and a policy permitting the user to get and put objects:
   ```
   {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "AWS": "replace_with_user_ARN"
                },
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject"
                ],
                "Resource": "<replace_with_accesspoint_ARN>/object/*"
            }
        ]
    }
   ```

## backend
1. run `./gradlew genSrc`
2. append the following properties in `src/main/resources/application.yml`:
```
aws-secret-key: <replace with secret key made in step 2.2>
# these can all be fake values
patreon-secret-key: fakekey
patreon-client-id: fakekey
secret-api-key: fakekey
```
3. modify `src/main/kotlin/coraythan/keyswap/thirdpartyservices/S3Service.kt`
```
private fun urlStart(bucket: String) = "s3://arn:aws:s3:us-east-1:1234567890:accesspoint/keyswap-ap" // get URI from s3 accesspoint props
// ...
    private val s3client = AmazonS3ClientBuilder
            .standard()
            .withCredentials(AWSStaticCredentialsProvider(BasicAWSCredentials(
                    "AKIAS...ELXO", // replace with user public token
                    awsSecretkey
            )))
            .withRegion(Regions.US_EAST_1) // replace with your region
            .build()
```
4. modify `src/main/kotlin/coraythan/keyswap/cards/CardService.kt` line 93
```
} catch (exception: Exception) {
    log.error("Nothing is going to work because we couldn't publish extra info!", exception)
    // throw IllegalStateException(exception) COMMENT THIS OUT
}
```
5. run `./gradlew bootRun`

## frontend
cd ui
npm install --legacy-peer-deps
npm run start