package coraythan.keyswap.thirdpartyservices

import org.springframework.web.multipart.MultipartFile
import java.util.UUID

interface FileService {
    fun getUrl(key: String): String
    fun addDeckImage(deckImage: MultipartFile, deckId: Long, userId: UUID, extension: String): String
    fun addStoreIcon(storeIcon: MultipartFile, userId: UUID, extension: String): String
    fun addStoreBanner(storeBanner: MultipartFile, userId: UUID, extension: String): String
    fun addGenericUserImg(img: MultipartFile, extension: String): String
    fun addTeamImg(img: MultipartFile, extension: String, teamId: UUID): String
    fun deleteUserContent(key: String)
}
