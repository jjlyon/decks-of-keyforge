package coraythan.keyswap.config

import org.springframework.beans.factory.annotation.Bean
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Configuration

@Configuration
class AwsConfig {

    @Bean
    AWSStaticCredentialsProvider awsCredentials(@Value("\${aws-public-key}") publicKey : String, @Value("\${aws-secret-key}") secretKey : String) {
        return AWSStaticCredentialsProvider(BasicAWSCredentials(
                publicKey,
                secretKey
        ))
    }

    @Bean
    AmazonS3Client s3Client(awsCredentials : AWSStaticCredentialsProvider, @Value("\${aws-region}") region : String) {
        
        return AmazonS3ClientBuilder
            .standard()
            .withCredentials(awsCredentials)
            .withRegion(Regions.US_EAST_1)
            .build()
    }
}