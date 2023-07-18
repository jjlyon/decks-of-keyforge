package coraythan.keyswap.config

import coraythan.keyswap.thirdpartyservices.FileService
import coraythan.keyswap.thirdpartyservices.LocalFileSystemFileService
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile

@Configuration
@Profile("development")
class LocalFileConfig {
    @Bean
    fun fileService(@Value("\${local.file.baseDir:src/test/resources/dok-user-content") baseDir: String) : FileService {
        return LocalFileSystemFileService(baseDir)
    }
}