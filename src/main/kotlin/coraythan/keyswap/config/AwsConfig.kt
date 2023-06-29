package coraythan.keyswap.config

import com.amazonaws.auth.AWSStaticCredentialsProvider
import com.amazonaws.auth.BasicAWSCredentials
import com.amazonaws.regions.Regions
import com.amazonaws.services.s3.AmazonS3
import com.amazonaws.services.s3.AmazonS3ClientBuilder
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
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

}