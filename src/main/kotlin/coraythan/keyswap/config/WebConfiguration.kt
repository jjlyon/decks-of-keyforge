package coraythan.keyswap.config

import coraythan.keyswap.Api
import coraythan.keyswap.decks.DeckSearchService
import coraythan.keyswap.users.search.UserSearchService
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Configuration
import org.springframework.core.io.Resource
import org.springframework.util.FileCopyUtils
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import org.springframework.web.servlet.resource.PathResourceResolver
import org.springframework.web.servlet.resource.TransformedResource
import java.io.IOException
import java.nio.charset.StandardCharsets

@Configuration
class WebConfiguration(
        private val userSearchService: UserSearchService,
        private val deckSearchService: DeckSearchService
) : WebMvcConfigurer {

    private val oneYearSeconds = 60 * 60 * 24 * 356

    private val log = LoggerFactory.getLogger(this::class.java)

    private var defaultIndexPage: TransformedResource? = null

    override fun addResourceHandlers(registry: ResourceHandlerRegistry) {

        registry
                .addResourceHandler(
                        "/**/*.css",
                        "/**/*.js",
                        "/**/*.jsx",
                        "/**/*.png",
                        "/**/*.jpg",
                        "/**/*.jpeg",
                        "/**/*.json",
                        "/**/*.xml",
                        "/**/*.ico",
                        "/**/*.svg",
                        "/**/*.webmanifest",
                        "/**/*.map"
                )
                .setCachePeriod(oneYearSeconds)
                .addResourceLocations("classpath:/static/")

        registry.addResourceHandler("/", "/**")
                .setCachePeriod(0)
                .addResourceLocations("classpath:/static/index.html")
                .resourceChain(false)
                .addResolver(object : PathResourceResolver() {
                    @Throws(IOException::class)
                    override fun getResource(resourcePath: String, location: Resource): Resource? {
                        log.info("Request for $resourcePath")
                        if (resourcePath.startsWith(Api.base) || resourcePath.startsWith(Api.base.substring(1))) {
                            return null
                        }

                        return if (location.exists() && location.isReadable) {
                            log.info("Getting index.html for $resourcePath")
                            location
                        } else {
                            null
                        }
                    }
                })
                .addTransformer { request, resource, _ ->

                    var cachedIndexPage: TransformedResource? = defaultIndexPage

                    val uri = request.requestURI
                    val query = request.queryString
//                    val info = "\nTransform for url ${request.requestURI}\n " +
//                            "path ${request.pathInfo}\n" +
//                            "query ${request.queryString}\n " +
//                            "user ${request.remoteUser}\n " +
//                            "headers ${request.headerNames.toList().map { it to request.getHeader(it) }} "

                    val queryStringValues = if (query != null) QueryStringParser(query) else null

                    val owner = queryStringValues?.findValue("owner")

                    if (uri.contains("/decks") && owner != null) {

                        val userStats = userSearchService.findStatsForUser(owner)

                        val transformed = transformIndexPage(
                                resource,
                                if (queryStringValues.contains("forSale")) "$owner's Decks for Sale" else "$owner's Decks",
                                if (userStats == null) "" else {
                                    if (queryStringValues.contains("forSale")) {
                                        "Search $owner's decks for sale. They have ${userStats.forSaleCount} decks listed."
                                    } else {
                                        "Search $owner's collection. They have ${userStats.deckCount} decks" +
                                                if (userStats.forSaleCount > 0) ", with ${userStats.forSaleCount} for sale." else "."
                                    }
                                }
                        )

                        transformed

                    } else if (uri.matches("/decks/[a-z0-9\\-]{36}.*".toRegex())) {

                        val deckId = uri.substring(7, 43)

                        val deck = deckSearchService.findDeckWithSynergies(deckId)

                        if (deck == null) {
                            resource
                        } else {
                            transformIndexPage(
                                    resource,
                                    deck.deck.name,
                                    deck.deck.printDeckSimple()
                            )
                        }

                    } else if (uri.contains("/cards")) {
                        transformIndexPage(
                                resource,
                                "Cards of KeyForge",
                                "Search KeyForge cards. View their ratings in the SAS and AERC rating systems."
                        )
                    } else if (uri.contains("/spoilers")) {
                        transformIndexPage(
                                resource,
                                "New Cards of KeyForge",
                                "Search spoilers for KeyForge cards from the upcoming set!"
                        )
                    } else if (uri.contains("/stats")) {
                        transformIndexPage(
                                resource,
                                "Stats of KeyForge",
                                "View statistics for the SAS and AERC rating systems, as well as the decks of KeyForge."
                        )
                    } else if (uri.contains("/users")) {
                        transformIndexPage(
                                resource,
                                "Collections of KeyForge",
                                "Search DoK users and their collections of decks. See how you stack up in total decks owned, power levels, or " +
                                        "highest SAS rated decks!"
                        )
                    } else if (uri.contains("/about/sas")) {
                        transformIndexPage(
                                resource,
                                "About SAS and AERC",
                                "Read about how KeyForge decks and cards are rated in the SAS and AERC rating systems."
                        )
                    } else if (uri.contains("/about")) {
                        transformIndexPage(
                                resource,
                                "About",
                                "Learn about Patron Rewards, contact the creators, and more on the DoK About pages."
                        )
                    } else {
                        if (cachedIndexPage == null) {
                            cachedIndexPage = transformIndexPage(resource)
                            defaultIndexPage = cachedIndexPage
                        }
                        cachedIndexPage
                    }

                }

    }

    private fun transformIndexPage(
            page: Resource,
            title: String = "Decks of KeyForge",
            description: String = "Search, evaluate, buy and sell KeyForge decks. Find synergies and antisynergies with the SAS and AERC rating systems."
//            image: String = "https://dok-imgs.s3.us-west-2.amazonaws.com/dok-square.png"
    ): TransformedResource {
        val bytes = FileCopyUtils.copyToByteArray(page.inputStream)
        val content = String(bytes, StandardCharsets.UTF_8)
        val modified = content
                .replace("~~title~~", "$title – DoK")
                .replace("~~description~~", description)
//                .replace("~~image~~", image)
                .toByteArray(StandardCharsets.UTF_8)

        return TransformedResource(page, modified)
    }
}

data class QueryStringParser(
        val queryString: String
) {
    val params: Map<String, List<String>> = queryString
            .split("&")
            .map {
                val splitVals = it.split("=")
                splitVals[0] to splitVals[1]
            }
            .groupBy { it.first }
            .mapValues { it.value.map { it.second } }

    fun findValue(param: String) = params[param]?.get(0)
    fun findValues(param: String) = params[param]
    fun contains(param: String) = !params[param].isNullOrEmpty()
}
