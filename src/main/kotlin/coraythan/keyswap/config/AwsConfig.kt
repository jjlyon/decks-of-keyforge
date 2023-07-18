package coraythan.keyswap.config

import com.amazonaws.auth.AWSStaticCredentialsProvider
import com.amazonaws.auth.BasicAWSCredentials
import com.amazonaws.regions.Regions
import com.amazonaws.services.s3.AmazonS3
import com.amazonaws.services.s3.AmazonS3Client
import com.amazonaws.services.s3.AmazonS3ClientBuilder
import coraythan.keyswap.thirdpartyservices.FileService
import coraythan.keyswap.thirdpartyservices.S3Service
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile

@Configuration
@Profile("!development")
class AwsConfig {

    @Bean
    fun credProvider(@Value("\${aws-public-key}") awsPublicKey: String,
                     @Value("\${aws-secret-key}") awsSecretKey: String) : AWSStaticCredentialsProvider {
        return AWSStaticCredentialsProvider(BasicAWSCredentials(
                awsPublicKey,
                awsSecretKey
        ))
    }

    @Bean
    fun s3Client(credProvider: AWSStaticCredentialsProvider, region: String) : AmazonS3 {
        return AmazonS3ClientBuilder
                .standard()
                .withCredentials(credProvider)
                .withRegion(Regions.fromName(region))
                .build()
    }

    @Bean
    fun fileService(s3Client: AmazonS3Client) : FileService {
        return S3Service(s3Client)
    }
}