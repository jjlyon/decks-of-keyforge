package coraythan.keyswap.thirdpartyservices

import org.springframework.web.multipart.MultipartFile
import java.nio.file.Files
import java.nio.file.Paths
import java.util.UUID

class LocalFileSystemFileService(
        private val baseDir: String
) : FileService {

    override fun getUrl(key: String): String {
        var file = Paths.get(baseDir, key).toAbsolutePath().toString()
        return "file://${file}"
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
        var path = Paths.get(baseDir, key)
        Files.delete(path)
    }

    private fun addImage(image: MultipartFile, folderName: String, details: String, extension: String? = null): String {

        val key = "$folderName/$details-${UUID.randomUUID()}${if (extension.isNullOrBlank()) "" else ".$extension"}"

        var path = Paths.get(baseDir, key)
        Files.write(path, image.bytes)

        return key
    }
}
