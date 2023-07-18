package coraythan.keyswap.thirdpartyservices

import com.amazonaws.services.s3.AmazonS3
import com.amazonaws.services.s3.model.ObjectMetadata
import com.amazonaws.services.s3.model.PutObjectRequest
import org.slf4j.LoggerFactory
import org.springframework.web.multipart.MultipartFile
import java.util.*

class S3Service(
        private val s3client: AmazonS3
) : FileService {

    private val log = LoggerFactory.getLogger(this::class.java)
    private final val userContentBucket = "dok-user-content"

    override fun getUrl(key: String): String {
        return s3client.getUrl(userContentBucket, key).toString()
    }

    override fun addDeckImage(deckImage: MultipartFile, deckId: Long, userId: UUID, extension: String): String {
        return addImage(deckImage, "deck-ownership", "$deckId-$userId", extension)
    }

    override fun addStoreIcon(storeIcon: MultipartFile, userId: UUID, extension: String): String {
        return addImage(storeIcon, "stores", "$userId-icon", extension)
    }

    override fun addStoreBanner(storeBanner: MultipartFile, userId: UUID, extension: String): String {
        return addImage(storeBanner, "stores", "$userId-banner", extension)
    }

    override fun addGenericUserImg(img: MultipartFile, extension: String): String {
        return addImage(img, "user-imgs", UUID.randomUUID().toString(), extension)
    }

    override fun addTeamImg(img: MultipartFile, extension: String, teamId: UUID): String {
        return addImage(img, "teams", teamId.toString(), extension)
    }

    override fun deleteUserContent(key: String) {
        s3client.deleteObject(
                userContentBucket,
                key
        )
    }

    private fun addImage(image: MultipartFile, folderName: String, details: String, extension: String? = null): String {

        val key = "$folderName/$details-${UUID.randomUUID()}${if (extension.isNullOrBlank()) "" else ".$extension"}"

        s3client.putObject(
                PutObjectRequest(
                        userContentBucket,
                        key,
                        image.inputStream,
                        ObjectMetadata()
                                .apply {
                                    this.cacheControl = "max-age=31536000"
                                    this.contentType = "image/jpeg"
                                }
                )
        )
        return key
    }
}
