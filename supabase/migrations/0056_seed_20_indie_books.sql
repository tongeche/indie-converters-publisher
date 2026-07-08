-- Seed a 20-book verified independent/small-press discovery batch.
-- Priority is given to African and African-diaspora authors, then to
-- independent/small-press translated fiction that fits the catalogue.
-- Edition metadata was checked against Open Library ISBN records and
-- publisher pages where available. Catalogue descriptions and bios are
-- original copy based on public bibliographic facts.

create temporary table _indie20_seed_books on commit drop as
select *
from jsonb_to_recordset($indie_seed$[
  {
    "title": "Blackass",
    "slug": "blackass",
    "subtitle": null,
    "authors": ["A. Igoni Barrett"],
    "author_slug": "a-igoni-barrett",
    "short_bio": "Nigerian writer known for sharp, satirical fiction about Lagos, race, and social performance.",
    "long_bio": "A. Igoni Barrett is a Nigerian writer whose fiction moves through Lagos life, class pressure, race, and the performances people adopt to survive public scrutiny. Blackass is his best-known novel in English-language small-press circulation. This original catalogue bio is based on public publisher and bibliographic metadata.",
    "bio_source": "generated_from_open_library_publisher_metadata",
    "bio_source_url": "https://www.graywolfpress.org/books/blackass",
    "bio_attribution": "Original catalogue bio based on Open Library and publisher metadata",
    "publisher": "Graywolf Press",
    "publisher_slug": "graywolf-press",
    "publisher_url": "https://www.graywolfpress.org/books/blackass",
    "description": "A Lagos-set satire in which a young Nigerian man wakes with white skin and a strange new social currency, exposing the absurd pressure of race, class, and ambition.",
    "cover_url": "https://covers.openlibrary.org/b/isbn/9781555977337-L.jpg",
    "pub_date": "2015-01-01",
    "page_count": 262,
    "isbn13": "9781555977337",
    "isbn10": "1555977332",
    "language": "English",
    "formats": ["Paperback", "eBook"],
    "keywords": ["nigerian fiction", "lagos", "satire", "race", "identity"],
    "genres": ["fiction", "literary-fiction", "african-literature"],
    "open_library_url": "https://openlibrary.org/isbn/9781555977337",
    "open_library_key": "/books/OL27206768M",
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://www.graywolfpress.org/books/blackass"},
      {"retailer": "open-library", "url": "https://openlibrary.org/isbn/9781555977337"}
    ],
    "classification": "small_press",
    "confidence": 96,
    "reason": "Graywolf Press is an independent nonprofit publisher; Open Library confirms the Graywolf edition and ISBN.",
    "evidence_urls": [
      "https://www.graywolfpress.org/books/blackass",
      "https://openlibrary.org/isbn/9781555977337"
    ]
  },
  {
    "title": "She Would Be King",
    "slug": "she-would-be-king",
    "subtitle": null,
    "authors": ["Wayétu Moore"],
    "author_slug": "wayetu-moore",
    "short_bio": "Liberian-born novelist and publisher whose work reimagines history, migration, and myth.",
    "long_bio": "Wayétu Moore is a Liberian-born writer and publisher whose fiction often blends historical memory, myth, migration, and questions of national origin. She Would Be King is her debut novel and reimagines the founding of Liberia through a mythic lens. This original catalogue bio is based on public publisher and bibliographic metadata.",
    "bio_source": "generated_from_open_library_publisher_metadata",
    "bio_source_url": "https://www.graywolfpress.org/books/she-would-be-king",
    "bio_attribution": "Original catalogue bio based on Open Library and publisher metadata",
    "publisher": "Graywolf Press",
    "publisher_slug": "graywolf-press",
    "publisher_url": "https://www.graywolfpress.org/books/she-would-be-king",
    "description": "A mythic historical novel about Liberia's founding, following three extraordinary characters whose gifts and burdens converge across continents.",
    "cover_url": "https://covers.openlibrary.org/b/isbn/9781555978174-L.jpg",
    "pub_date": "2018-01-01",
    "page_count": 294,
    "isbn13": "9781555978174",
    "isbn10": "1555978177",
    "language": "English",
    "formats": ["Paperback", "eBook", "Hardcover"],
    "keywords": ["liberia", "historical fiction", "myth", "diaspora", "founding story"],
    "genres": ["fiction", "historical-fiction", "african-literature"],
    "open_library_url": "https://openlibrary.org/isbn/9781555978174",
    "open_library_key": "/books/OL26609837M",
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://www.graywolfpress.org/books/she-would-be-king"},
      {"retailer": "open-library", "url": "https://openlibrary.org/isbn/9781555978174"}
    ],
    "classification": "small_press",
    "confidence": 96,
    "reason": "Graywolf Press is an independent nonprofit publisher; Open Library confirms the Graywolf edition and ISBN.",
    "evidence_urls": [
      "https://www.graywolfpress.org/books/she-would-be-king",
      "https://openlibrary.org/isbn/9781555978174"
    ]
  },
  {
    "title": "Like a Mule Bringing Ice Cream to the Sun",
    "slug": "like-a-mule-bringing-ice-cream-to-the-sun",
    "subtitle": null,
    "authors": ["Sarah Ladipo Manyika"],
    "author_slug": "sarah-ladipo-manyika",
    "short_bio": "Nigerian-British writer whose fiction often follows women, memory, aging, and belonging.",
    "long_bio": "Sarah Ladipo Manyika is a Nigerian-British writer whose fiction explores memory, aging, migration, art, and the lives of women moving between places and identities. Like a Mule Bringing Ice Cream to the Sun was published by Cassava Republic. This original catalogue bio is based on public publisher and bibliographic metadata.",
    "bio_source": "generated_from_open_library_publisher_metadata",
    "bio_source_url": "https://cassavarepublic.biz/product/like-a-mule-bringing-ice-cream-to-the-sun/",
    "bio_attribution": "Original catalogue bio based on Open Library and publisher metadata",
    "publisher": "Cassava Republic",
    "publisher_slug": "cassava-republic",
    "publisher_url": "https://cassavarepublic.biz/product/like-a-mule-bringing-ice-cream-to-the-sun/",
    "description": "A concise, luminous novel about aging, solitude, friendship, and self-possession, centered on a seventy-five-year-old Nigerian woman in San Francisco.",
    "cover_url": "https://covers.openlibrary.org/b/isbn/9781911115045-L.jpg",
    "pub_date": "2016-01-01",
    "page_count": 118,
    "isbn13": "9781911115045",
    "isbn10": "1911115049",
    "language": "English",
    "formats": ["Paperback", "eBook"],
    "keywords": ["aging", "nigerian fiction", "san francisco", "solitude", "women"],
    "genres": ["fiction", "literary-fiction", "african-literature"],
    "open_library_url": "https://openlibrary.org/isbn/9781911115045",
    "open_library_key": "/books/OL27236513M",
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://cassavarepublic.biz/product/like-a-mule-bringing-ice-cream-to-the-sun/"},
      {"retailer": "open-library", "url": "https://openlibrary.org/isbn/9781911115045"}
    ],
    "classification": "small_press",
    "confidence": 96,
    "reason": "Cassava Republic is an independent African publishing house; Open Library confirms the Cassava Republic edition and ISBN.",
    "evidence_urls": [
      "https://cassavarepublic.biz/product/like-a-mule-bringing-ice-cream-to-the-sun/",
      "https://openlibrary.org/isbn/9781911115045"
    ]
  },
  {
    "title": "When We Speak of Nothing",
    "slug": "when-we-speak-of-nothing",
    "subtitle": null,
    "authors": ["Olumide Popoola"],
    "author_slug": "olumide-popoola",
    "short_bio": "Nigerian-German writer whose fiction works across friendship, queerness, London, and the Niger Delta.",
    "long_bio": "Olumide Popoola is a Nigerian-German writer whose novels, plays, and essays often focus on queer life, friendship, displacement, and the pressures of contemporary cities. When We Speak of Nothing was published by Cassava Republic Press. This original catalogue bio is based on public publisher and bibliographic metadata.",
    "bio_source": "generated_from_open_library_publisher_metadata",
    "bio_source_url": "https://cassavarepublic.biz/product/when-we-speak-of-nothing/",
    "bio_attribution": "Original catalogue bio based on Open Library and publisher metadata",
    "publisher": "Cassava Republic Press",
    "publisher_slug": "cassava-republic-press",
    "publisher_url": "https://cassavarepublic.biz/product/when-we-speak-of-nothing/",
    "description": "A coming-of-age novel moving between London and the Niger Delta, following two friends through queerness, family pressure, violence, and political unrest.",
    "cover_url": "https://covers.openlibrary.org/b/isbn/9781911115458-L.jpg",
    "pub_date": "2017-01-01",
    "page_count": 253,
    "isbn13": "9781911115458",
    "isbn10": "1911115456",
    "language": "English",
    "formats": ["Paperback", "eBook"],
    "keywords": ["queer fiction", "nigerian fiction", "london", "niger delta", "friendship"],
    "genres": ["fiction", "queer-fiction", "african-literature"],
    "open_library_url": "https://openlibrary.org/isbn/9781911115458",
    "open_library_key": "/books/OL26965001M",
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://cassavarepublic.biz/product/when-we-speak-of-nothing/"},
      {"retailer": "open-library", "url": "https://openlibrary.org/isbn/9781911115458"}
    ],
    "classification": "small_press",
    "confidence": 96,
    "reason": "Cassava Republic Press is an independent African publishing house; Open Library confirms the Cassava Republic Press edition and ISBN.",
    "evidence_urls": [
      "https://cassavarepublic.biz/product/when-we-speak-of-nothing/",
      "https://openlibrary.org/isbn/9781911115458"
    ]
  },
  {
    "title": "Kintu",
    "slug": "kintu",
    "subtitle": null,
    "authors": ["Jennifer Nansubuga Makumbi"],
    "author_slug": "jennifer-nansubuga-makumbi",
    "short_bio": "Ugandan novelist whose work brings historical sweep and family mythology into contemporary fiction.",
    "long_bio": "Jennifer Nansubuga Makumbi is a Ugandan novelist and short story writer whose fiction connects family inheritance, oral tradition, gender, and national history. Kintu is a major Ugandan novel in English and was issued in the United States by independent publisher Transit Books. This original catalogue bio is based on public publisher and bibliographic metadata.",
    "bio_source": "generated_from_open_library_publisher_metadata",
    "bio_source_url": "https://www.transitbooks.org/books/kintu",
    "bio_attribution": "Original catalogue bio based on Open Library and publisher metadata",
    "publisher": "Transit Books",
    "publisher_slug": "transit-books",
    "publisher_url": "https://www.transitbooks.org/books/kintu",
    "description": "A multigenerational Ugandan epic tracing a family's curse across centuries of political change, kinship, memory, and myth.",
    "cover_url": "https://covers.openlibrary.org/b/isbn/9781945492013-L.jpg",
    "pub_date": "2017-01-01",
    "page_count": 443,
    "isbn13": "9781945492013",
    "isbn10": "1945492015",
    "language": "English",
    "formats": ["Paperback", "eBook"],
    "keywords": ["uganda", "family saga", "myth", "history", "ancestry"],
    "genres": ["fiction", "historical-fiction", "african-literature"],
    "open_library_url": "https://openlibrary.org/isbn/9781945492013",
    "open_library_key": "/books/OL27234924M",
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://www.transitbooks.org/books/kintu"},
      {"retailer": "open-library", "url": "https://openlibrary.org/isbn/9781945492013"}
    ],
    "classification": "small_press",
    "confidence": 96,
    "reason": "Transit Books is an independent publisher; Open Library confirms the Transit Books edition and ISBN.",
    "evidence_urls": [
      "https://www.transitbooks.org/books/kintu",
      "https://openlibrary.org/isbn/9781945492013"
    ]
  },
  {
    "title": "The Hundred Wells of Salaga",
    "slug": "the-hundred-wells-of-salaga",
    "subtitle": null,
    "authors": ["Ayesha Harruna Attah"],
    "author_slug": "ayesha-harruna-attah",
    "short_bio": "Ghanaian novelist whose historical fiction often centers women, power, and West African memory.",
    "long_bio": "Ayesha Harruna Attah is a Ghanaian novelist whose work often explores women's lives, migration, power, and the overlooked textures of West African history. The Hundred Wells of Salaga appeared in a US edition from independent publisher Other Press. This original catalogue bio is based on public publisher and bibliographic metadata.",
    "bio_source": "generated_from_open_library_publisher_metadata",
    "bio_source_url": "https://otherpress.com/product/the-hundred-wells-of-salaga-9781590519950/",
    "bio_attribution": "Original catalogue bio based on Open Library and publisher metadata",
    "publisher": "Other Press",
    "publisher_slug": "other-press",
    "publisher_url": "https://otherpress.com/product/the-hundred-wells-of-salaga-9781590519950/",
    "description": "A historical novel set around Ghana's Salaga slave market, following two women whose lives expose the human cost of power and trade.",
    "cover_url": "https://covers.openlibrary.org/b/isbn/9781590519950-L.jpg",
    "pub_date": "2019-02-05",
    "page_count": 240,
    "isbn13": "9781590519950",
    "isbn10": "1590519957",
    "language": "English",
    "formats": ["Paperback", "eBook"],
    "keywords": ["ghana", "historical fiction", "women", "salaga", "slavery"],
    "genres": ["fiction", "historical-fiction", "african-literature"],
    "open_library_url": "https://openlibrary.org/isbn/9781590519950",
    "open_library_key": "/books/OL27335089M",
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://otherpress.com/product/the-hundred-wells-of-salaga-9781590519950/"},
      {"retailer": "open-library", "url": "https://openlibrary.org/isbn/9781590519950"}
    ],
    "classification": "small_press",
    "confidence": 95,
    "reason": "Other Press is an independent publisher; Open Library confirms the Other Press edition and ISBN.",
    "evidence_urls": [
      "https://otherpress.com/product/the-hundred-wells-of-salaga-9781590519950/",
      "https://openlibrary.org/isbn/9781590519950"
    ]
  },
  {
    "title": "A General Theory of Oblivion",
    "slug": "a-general-theory-of-oblivion",
    "subtitle": null,
    "authors": ["José Eduardo Agualusa"],
    "author_slug": "jose-eduardo-agualusa",
    "short_bio": "Angolan novelist whose translated fiction often moves through memory, politics, and private myth.",
    "long_bio": "José Eduardo Agualusa is an Angolan novelist and journalist whose fiction moves through memory, political rupture, exile, and the myths people make from history. A General Theory of Oblivion appeared in English from independent publisher Archipelago. This original catalogue bio is based on public publisher and bibliographic metadata.",
    "bio_source": "generated_from_open_library_publisher_metadata",
    "bio_source_url": "https://archipelagobooks.org/book/a-general-theory-of-oblivion/",
    "bio_attribution": "Original catalogue bio based on Open Library and publisher metadata",
    "publisher": "Archipelago Books",
    "publisher_slug": "archipelago-books",
    "publisher_url": "https://archipelagobooks.org/book/a-general-theory-of-oblivion/",
    "description": "A translated Angolan novel about a woman who walls herself inside her apartment as history, revolution, and memory continue around her.",
    "cover_url": "https://covers.openlibrary.org/b/isbn/9780914671312-L.jpg",
    "pub_date": "2015-01-01",
    "page_count": 244,
    "isbn13": "9780914671312",
    "isbn10": "0914671316",
    "language": "English",
    "formats": ["Paperback", "eBook"],
    "keywords": ["angola", "translated fiction", "memory", "revolution", "isolation"],
    "genres": ["fiction", "translated-fiction", "african-literature"],
    "open_library_url": "https://openlibrary.org/isbn/9780914671312",
    "open_library_key": "/books/OL26944867M",
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://archipelagobooks.org/book/a-general-theory-of-oblivion/"},
      {"retailer": "open-library", "url": "https://openlibrary.org/isbn/9780914671312"}
    ],
    "classification": "small_press",
    "confidence": 95,
    "reason": "Archipelago Books is an independent nonprofit press; Open Library confirms the Archipelago edition and ISBN.",
    "evidence_urls": [
      "https://archipelagobooks.org/book/a-general-theory-of-oblivion/",
      "https://openlibrary.org/isbn/9780914671312"
    ]
  },
  {
    "title": "Transparent City",
    "slug": "transparent-city",
    "subtitle": null,
    "authors": ["Ondjaki"],
    "author_slug": "ondjaki",
    "short_bio": "Angolan writer and poet whose fiction gives Luanda a playful, political, and lyrical charge.",
    "long_bio": "Ondjaki is an Angolan writer, poet, and filmmaker whose work is known for its playful language, civic attention, and lyrical portraits of Luanda. Transparent City appeared in English from independent Canadian publisher Biblioasis. This original catalogue bio is based on public publisher and bibliographic metadata.",
    "bio_source": "generated_from_open_library_publisher_metadata",
    "bio_source_url": "https://www.biblioasis.com/shop/fiction/translated-fiction/transparent-city/",
    "bio_attribution": "Original catalogue bio based on Open Library and publisher metadata",
    "publisher": "Biblioasis",
    "publisher_slug": "biblioasis",
    "publisher_url": "https://www.biblioasis.com/shop/fiction/translated-fiction/transparent-city/",
    "description": "A polyphonic Luanda novel where apartment blocks, rumors, bureaucracy, humor, and political pressure turn the city itself into a living character.",
    "cover_url": "https://covers.openlibrary.org/b/isbn/9781771961448-L.jpg",
    "pub_date": "2018-01-01",
    "page_count": 400,
    "isbn13": "9781771961448",
    "isbn10": "1771961449",
    "language": "English",
    "formats": ["Paperback", "eBook"],
    "keywords": ["angola", "luanda", "translated fiction", "city novel", "political fiction"],
    "genres": ["fiction", "translated-fiction", "african-literature"],
    "open_library_url": "https://openlibrary.org/isbn/9781771961448",
    "open_library_key": "/books/OL52597023M",
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://www.biblioasis.com/shop/fiction/translated-fiction/transparent-city/"},
      {"retailer": "open-library", "url": "https://openlibrary.org/isbn/9781771961448"}
    ],
    "classification": "small_press",
    "confidence": 95,
    "reason": "Biblioasis is an independent publisher; Open Library confirms the Biblioasis edition and ISBN.",
    "evidence_urls": [
      "https://www.biblioasis.com/shop/fiction/translated-fiction/transparent-city/",
      "https://openlibrary.org/isbn/9781771961448"
    ]
  },
  {
    "title": "Tram 83",
    "slug": "tram-83",
    "subtitle": null,
    "authors": ["Fiston Mwanza Mujila"],
    "author_slug": "fiston-mwanza-mujila",
    "short_bio": "Congolese writer whose work is known for jazz-like rhythm, urban energy, and political edge.",
    "long_bio": "Fiston Mwanza Mujila is a Congolese writer whose fiction and poetry combine jazz-like rhythm, urban intensity, and sharp political observation. Tram 83 appeared in English from independent publisher Deep Vellum. This original catalogue bio is based on public publisher and bibliographic metadata.",
    "bio_source": "generated_from_open_library_publisher_metadata",
    "bio_source_url": "https://store.deepvellum.org/products/tram-83",
    "bio_attribution": "Original catalogue bio based on Open Library and publisher metadata",
    "publisher": "Deep Vellum Publishing",
    "publisher_slug": "deep-vellum-publishing",
    "publisher_url": "https://store.deepvellum.org/products/tram-83",
    "description": "A feverish, jazz-inflected novel set in a mining-town nightclub where writers, hustlers, miners, and tourists collide under economic pressure.",
    "cover_url": "https://covers.openlibrary.org/b/isbn/9781941920046-L.jpg",
    "pub_date": "2015-01-01",
    "page_count": 211,
    "isbn13": "9781941920046",
    "isbn10": "1941920047",
    "language": "English",
    "formats": ["Paperback", "eBook"],
    "keywords": ["congo", "translated fiction", "jazz", "nightlife", "mining town"],
    "genres": ["fiction", "translated-fiction", "african-literature"],
    "open_library_url": "https://openlibrary.org/isbn/9781941920046",
    "open_library_key": "/books/OL27193117M",
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://store.deepvellum.org/products/tram-83"},
      {"retailer": "open-library", "url": "https://openlibrary.org/isbn/9781941920046"}
    ],
    "classification": "small_press",
    "confidence": 96,
    "reason": "Deep Vellum is an independent nonprofit publisher; Open Library confirms the Deep Vellum edition and ISBN.",
    "evidence_urls": [
      "https://store.deepvellum.org/products/tram-83",
      "https://openlibrary.org/isbn/9781941920046"
    ]
  },
  {
    "title": "The House of Rust",
    "slug": "the-house-of-rust",
    "subtitle": null,
    "authors": ["Khadija Abdalla Bajaber"],
    "author_slug": "khadija-abdalla-bajaber",
    "short_bio": "Kenyan writer whose fiction draws from coastal myth, girlhood, faith, and the sea.",
    "long_bio": "Khadija Abdalla Bajaber is a Kenyan writer whose fiction draws from coastal myth, faith, family, girlhood, and the Indian Ocean world. The House of Rust was published by Graywolf Press as a Graywolf Africa Prize winner. This original catalogue bio is based on public publisher and bibliographic metadata.",
    "bio_source": "generated_from_open_library_publisher_metadata",
    "bio_source_url": "https://www.graywolfpress.org/books/house-rust",
    "bio_attribution": "Original catalogue bio based on Open Library and publisher metadata",
    "publisher": "Graywolf Press",
    "publisher_slug": "graywolf-press",
    "publisher_url": "https://www.graywolfpress.org/books/house-rust",
    "description": "A Kenyan coastal fantasy about a girl, a missing fisherman father, spirits, creatures, and a journey into the mythic life of the sea.",
    "cover_url": "https://covers.openlibrary.org/b/isbn/9781644450680-L.jpg",
    "pub_date": "2021-10-19",
    "page_count": 272,
    "isbn13": "9781644450680",
    "isbn10": "1644450682",
    "language": "English",
    "formats": ["Paperback", "eBook"],
    "keywords": ["kenya", "fantasy", "coastal fiction", "myth", "sea"],
    "genres": ["fiction", "speculative-fiction", "african-literature"],
    "open_library_url": "https://openlibrary.org/isbn/9781644450680",
    "open_library_key": "/books/OL32478788M",
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://www.graywolfpress.org/books/house-rust"},
      {"retailer": "open-library", "url": "https://openlibrary.org/isbn/9781644450680"}
    ],
    "classification": "small_press",
    "confidence": 97,
    "reason": "Graywolf Press is an independent nonprofit publisher; Open Library confirms the Graywolf edition and ISBN.",
    "evidence_urls": [
      "https://www.graywolfpress.org/books/house-rust",
      "https://openlibrary.org/isbn/9781644450680"
    ]
  },
  {
    "title": "All Your Children, Scattered",
    "slug": "all-your-children-scattered",
    "subtitle": null,
    "authors": ["Beata Umubyeyi Mairesse"],
    "author_slug": "beata-umubyeyi-mairesse",
    "short_bio": "Rwandan-born writer whose fiction and poetry examine memory, survival, family, and diaspora.",
    "long_bio": "Beata Umubyeyi Mairesse is a Rwandan-born writer whose fiction and poetry return to memory, family, survival, language, and diaspora after the genocide against the Tutsi. All Your Children, Scattered appeared in English from Europa Editions. This original catalogue bio is based on public publisher and bibliographic metadata.",
    "bio_source": "generated_from_open_library_publisher_metadata",
    "bio_source_url": "https://www.europaeditions.com/book/9781609457853/all-your-children-scattered",
    "bio_attribution": "Original catalogue bio based on Open Library and publisher metadata",
    "publisher": "Europa Editions",
    "publisher_slug": "europa-editions",
    "publisher_url": "https://www.europaeditions.com/book/9781609457853/all-your-children-scattered",
    "description": "A compact Rwandan family novel tracing three generations through loss, exile, return, and the difficult work of speaking after historical trauma.",
    "cover_url": "https://covers.openlibrary.org/b/isbn/9781609457853-L.jpg",
    "pub_date": "2022-08-23",
    "page_count": 192,
    "isbn13": "9781609457853",
    "isbn10": "1609457854",
    "language": "English",
    "formats": ["Paperback", "eBook"],
    "keywords": ["rwanda", "family", "diaspora", "translation", "memory"],
    "genres": ["fiction", "translated-fiction", "african-literature"],
    "open_library_url": "https://openlibrary.org/isbn/9781609457853",
    "open_library_key": "/books/OL38060933M",
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://www.europaeditions.com/book/9781609457853/all-your-children-scattered"},
      {"retailer": "open-library", "url": "https://openlibrary.org/isbn/9781609457853"}
    ],
    "classification": "small_press",
    "confidence": 95,
    "reason": "Europa Editions is an independent publisher; publisher and Open Library records confirm the edition and ISBN.",
    "evidence_urls": [
      "https://www.europaeditions.com/book/9781609457853/all-your-children-scattered",
      "https://openlibrary.org/isbn/9781609457853"
    ]
  },
  {
    "title": "If an Egyptian Cannot Speak English",
    "slug": "if-an-egyptian-cannot-speak-english",
    "subtitle": null,
    "authors": ["Noor Naga"],
    "author_slug": "noor-naga",
    "short_bio": "Egyptian-Canadian writer whose fiction explores language, power, desire, and return.",
    "long_bio": "Noor Naga is an Egyptian-Canadian writer whose fiction and poetry examine language, desire, power, cultural return, and the stories people tell about belonging. If an Egyptian Cannot Speak English was published by Graywolf Press. This original catalogue bio is based on public publisher and bibliographic metadata.",
    "bio_source": "generated_from_open_library_publisher_metadata",
    "bio_source_url": "https://www.graywolfpress.org/books/if-egyptian-cannot-speak-english",
    "bio_attribution": "Original catalogue bio based on Open Library and publisher metadata",
    "publisher": "Graywolf Press",
    "publisher_slug": "graywolf-press",
    "publisher_url": "https://www.graywolfpress.org/books/if-egyptian-cannot-speak-english",
    "description": "A formally inventive novel about language, intimacy, displacement, and the unstable meanings of home after Egypt's revolution.",
    "cover_url": "https://covers.openlibrary.org/b/isbn/9781644450819-L.jpg",
    "pub_date": "2022-04-05",
    "page_count": 192,
    "isbn13": "9781644450819",
    "isbn10": "164445081X",
    "language": "English",
    "formats": ["Paperback", "eBook"],
    "keywords": ["egypt", "diaspora", "language", "revolution", "experimental fiction"],
    "genres": ["fiction", "experimental-fiction", "african-literature"],
    "open_library_url": "https://openlibrary.org/isbn/9781644450819",
    "open_library_key": "/books/OL32495098M",
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://www.graywolfpress.org/books/if-egyptian-cannot-speak-english"},
      {"retailer": "open-library", "url": "https://openlibrary.org/isbn/9781644450819"}
    ],
    "classification": "small_press",
    "confidence": 96,
    "reason": "Graywolf Press is an independent nonprofit publisher; Open Library confirms the Graywolf edition and ISBN.",
    "evidence_urls": [
      "https://www.graywolfpress.org/books/if-egyptian-cannot-speak-english",
      "https://openlibrary.org/isbn/9781644450819"
    ]
  },
  {
    "title": "Tomb of Sand",
    "slug": "tomb-of-sand",
    "subtitle": null,
    "authors": ["Geetanjali Shree"],
    "author_slug": "geetanjali-shree",
    "short_bio": "Hindi-language novelist whose translated work moves through family, border, age, and reinvention.",
    "long_bio": "Geetanjali Shree is an Indian novelist writing in Hindi. Her translated fiction often moves through family memory, borders, aging, and the disruptive possibilities of reinvention. Tomb of Sand appeared in English from independent publisher Tilted Axis Press. This original catalogue bio is based on public publisher and bibliographic metadata.",
    "bio_source": "generated_from_open_library_publisher_metadata",
    "bio_source_url": "https://www.tiltedaxispress.com/tomb-of-sand",
    "bio_attribution": "Original catalogue bio based on Open Library and publisher metadata",
    "publisher": "Tilted Axis Press",
    "publisher_slug": "tilted-axis-press",
    "publisher_url": "https://www.tiltedaxispress.com/tomb-of-sand",
    "description": "A large, playful Hindi novel in translation about an elderly woman's grief, reinvention, and border-crossing after her husband's death.",
    "cover_url": "https://covers.openlibrary.org/b/isbn/9781911284611-L.jpg",
    "pub_date": "2021-01-01",
    "page_count": 725,
    "isbn13": "9781911284611",
    "isbn10": "1911284614",
    "language": "English",
    "formats": ["Paperback", "eBook"],
    "keywords": ["translated fiction", "hindi", "india", "partition", "family"],
    "genres": ["fiction", "translated-fiction", "world-literature"],
    "open_library_url": "https://openlibrary.org/isbn/9781911284611",
    "open_library_key": "/books/OL33914780M",
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://www.tiltedaxispress.com/tomb-of-sand"},
      {"retailer": "open-library", "url": "https://openlibrary.org/isbn/9781911284611"}
    ],
    "classification": "small_press",
    "confidence": 96,
    "reason": "Tilted Axis Press is an independent nonprofit press; Open Library confirms the Tilted Axis Press edition and ISBN.",
    "evidence_urls": [
      "https://www.tiltedaxispress.com/tomb-of-sand",
      "https://openlibrary.org/isbn/9781911284611"
    ]
  },
  {
    "title": "Boulder",
    "slug": "boulder",
    "subtitle": null,
    "authors": ["Eva Baltasar"],
    "author_slug": "eva-baltasar",
    "short_bio": "Catalan poet and novelist whose spare fiction examines desire, solitude, and domestic pressure.",
    "long_bio": "Eva Baltasar is a Catalan poet and novelist whose spare fiction often examines desire, solitude, work, motherhood, and the limits of domestic life. Boulder appeared in English from independent publisher And Other Stories. This original catalogue bio is based on public publisher and bibliographic metadata.",
    "bio_source": "generated_from_open_library_publisher_metadata",
    "bio_source_url": "https://www.andotherstories.org/boulder/",
    "bio_attribution": "Original catalogue bio based on Open Library and publisher metadata",
    "publisher": "And Other Stories",
    "publisher_slug": "and-other-stories",
    "publisher_url": "https://www.andotherstories.org/boulder/",
    "description": "A sharp Catalan novella about a cook at sea, a relationship, and the pressure placed on love when one partner wants a child.",
    "cover_url": "https://covers.openlibrary.org/b/isbn/9781913505387-L.jpg",
    "pub_date": "2022-01-01",
    "page_count": 112,
    "isbn13": "9781913505387",
    "isbn10": "1913505383",
    "language": "English",
    "formats": ["Paperback", "eBook"],
    "keywords": ["translated fiction", "catalan", "queer fiction", "motherhood", "relationships"],
    "genres": ["fiction", "translated-fiction", "queer-fiction"],
    "open_library_url": "https://openlibrary.org/isbn/9781913505387",
    "open_library_key": "/books/OL36019194M",
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://www.andotherstories.org/boulder/"},
      {"retailer": "open-library", "url": "https://openlibrary.org/isbn/9781913505387"}
    ],
    "classification": "small_press",
    "confidence": 96,
    "reason": "And Other Stories is an independent publisher; Open Library confirms the And Other Stories edition and ISBN.",
    "evidence_urls": [
      "https://www.andotherstories.org/boulder/",
      "https://openlibrary.org/isbn/9781913505387"
    ]
  },
  {
    "title": "Elena Knows",
    "slug": "elena-knows",
    "subtitle": null,
    "authors": ["Claudia Piñeiro"],
    "author_slug": "claudia-pineiro",
    "short_bio": "Argentine novelist and playwright whose fiction often combines social critique with crime and family tension.",
    "long_bio": "Claudia Piñeiro is an Argentine novelist, playwright, and screenwriter whose fiction often combines crime, family tension, political critique, and moral ambiguity. Elena Knows appeared in English from independent publisher Charco Press. This original catalogue bio is based on public publisher and bibliographic metadata.",
    "bio_source": "generated_from_open_library_publisher_metadata",
    "bio_source_url": "https://charcopress.com/bookstore/elena-knows",
    "bio_attribution": "Original catalogue bio based on Open Library and publisher metadata",
    "publisher": "Charco Press",
    "publisher_slug": "charco-press",
    "publisher_url": "https://charcopress.com/bookstore/elena-knows",
    "description": "An Argentine novel about a mother with Parkinson's investigating her daughter's death, moving through grief, bodily autonomy, and hidden family truths.",
    "cover_url": "https://covers.openlibrary.org/b/isbn/9781999368432-L.jpg",
    "pub_date": "2021-07-13",
    "page_count": 173,
    "isbn13": "9781999368432",
    "isbn10": "1999368436",
    "language": "English",
    "formats": ["Paperback", "eBook"],
    "keywords": ["translated fiction", "argentina", "mystery", "motherhood", "illness"],
    "genres": ["fiction", "translated-fiction", "literary-fiction"],
    "open_library_url": "https://openlibrary.org/isbn/9781999368432",
    "open_library_key": "/books/OL32935967M",
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://charcopress.com/bookstore/elena-knows"},
      {"retailer": "open-library", "url": "https://openlibrary.org/isbn/9781999368432"}
    ],
    "classification": "small_press",
    "confidence": 96,
    "reason": "Charco Press is an independent publisher of Latin American literature; Open Library confirms the Charco Press edition and ISBN.",
    "evidence_urls": [
      "https://charcopress.com/bookstore/elena-knows",
      "https://openlibrary.org/isbn/9781999368432"
    ]
  },
  {
    "title": "Jawbone",
    "slug": "jawbone",
    "subtitle": null,
    "authors": ["Mónica Ojeda"],
    "author_slug": "monica-ojeda",
    "short_bio": "Ecuadorian novelist whose fiction blends literary horror, adolescence, ritual, and language.",
    "long_bio": "Mónica Ojeda is an Ecuadorian novelist and poet whose fiction blends literary horror, adolescence, ritual, violence, and the charged language of obsession. Jawbone appeared in English from independent publisher Coffee House Press. This original catalogue bio is based on public publisher and bibliographic metadata.",
    "bio_source": "generated_from_open_library_publisher_metadata",
    "bio_source_url": "https://coffeehousepress.org/products/jawbone",
    "bio_attribution": "Original catalogue bio based on Open Library and publisher metadata",
    "publisher": "Coffee House Press",
    "publisher_slug": "coffee-house-press",
    "publisher_url": "https://coffeehousepress.org/products/jawbone",
    "description": "A literary horror novel about schoolgirls, obsession, religion, violence, and the terrifying stories adolescents invent for one another.",
    "cover_url": "https://covers.openlibrary.org/b/isbn/9781566896214-L.jpg",
    "pub_date": "2022-01-01",
    "page_count": 272,
    "isbn13": "9781566896214",
    "isbn10": "1566896215",
    "language": "English",
    "formats": ["Paperback", "eBook"],
    "keywords": ["translated fiction", "ecuador", "literary horror", "adolescence", "school"],
    "genres": ["fiction", "translated-fiction", "horror"],
    "open_library_url": "https://openlibrary.org/isbn/9781566896214",
    "open_library_key": "/books/OL34151863M",
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://coffeehousepress.org/products/jawbone"},
      {"retailer": "open-library", "url": "https://openlibrary.org/isbn/9781566896214"}
    ],
    "classification": "small_press",
    "confidence": 96,
    "reason": "Coffee House Press is an independent nonprofit publisher; Open Library confirms the Coffee House Press edition and ISBN.",
    "evidence_urls": [
      "https://coffeehousepress.org/products/jawbone",
      "https://openlibrary.org/isbn/9781566896214"
    ]
  },
  {
    "title": "Convenience Store Woman",
    "slug": "convenience-store-woman",
    "subtitle": null,
    "authors": ["Sayaka Murata"],
    "author_slug": "sayaka-murata",
    "short_bio": "Japanese novelist whose fiction examines work, conformity, alienation, and social performance.",
    "long_bio": "Sayaka Murata is a Japanese novelist whose fiction examines work, conformity, social performance, alienation, and the pressure to pass as normal. Convenience Store Woman appeared in a US edition from independent publisher Grove Press. This original catalogue bio is based on public publisher and bibliographic metadata.",
    "bio_source": "generated_from_open_library_publisher_metadata",
    "bio_source_url": "https://groveatlantic.com/book/convenience-store-woman/",
    "bio_attribution": "Original catalogue bio based on Open Library and publisher metadata",
    "publisher": "Grove Press",
    "publisher_slug": "grove-press",
    "publisher_url": "https://groveatlantic.com/book/convenience-store-woman/",
    "description": "A compact Japanese novel about a convenience store worker whose sense of order clashes with social expectations around career, romance, and normal life.",
    "cover_url": "https://covers.openlibrary.org/b/isbn/9780802128256-L.jpg",
    "pub_date": "2018-01-01",
    "page_count": 163,
    "isbn13": "9780802128256",
    "isbn10": "0802128254",
    "language": "English",
    "formats": ["Paperback", "eBook"],
    "keywords": ["translated fiction", "japan", "work", "conformity", "alienation"],
    "genres": ["fiction", "translated-fiction", "literary-fiction"],
    "open_library_url": "https://openlibrary.org/isbn/9780802128256",
    "open_library_key": "/books/OL26957093M",
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://groveatlantic.com/book/convenience-store-woman/"},
      {"retailer": "open-library", "url": "https://openlibrary.org/isbn/9780802128256"}
    ],
    "classification": "small_press",
    "confidence": 92,
    "reason": "Grove Press is part of independent publisher Grove Atlantic; Open Library confirms the Grove Press edition and ISBN.",
    "evidence_urls": [
      "https://groveatlantic.com/book/convenience-store-woman/",
      "https://openlibrary.org/isbn/9780802128256"
    ]
  },
  {
    "title": "The Story of My Teeth",
    "slug": "the-story-of-my-teeth",
    "subtitle": null,
    "authors": ["Valeria Luiselli"],
    "author_slug": "valeria-luiselli",
    "short_bio": "Mexican writer whose novels and essays experiment with form, voice, migration, and art.",
    "long_bio": "Valeria Luiselli is a Mexican writer whose fiction and essays experiment with form, voice, migration, art, and the way stories circulate through institutions and cities. The Story of My Teeth appeared from independent publisher Coffee House Press. This original catalogue bio is based on public publisher and bibliographic metadata.",
    "bio_source": "generated_from_open_library_publisher_metadata",
    "bio_source_url": "https://coffeehousepress.org/products/the-story-of-my-teeth",
    "bio_attribution": "Original catalogue bio based on Open Library and publisher metadata",
    "publisher": "Coffee House Press",
    "publisher_slug": "coffee-house-press",
    "publisher_url": "https://coffeehousepress.org/products/the-story-of-my-teeth",
    "description": "A playful Mexican novel about an auctioneer, storytelling, value, and the strange commerce of objects and legends.",
    "cover_url": "https://covers.openlibrary.org/b/isbn/9781566894098-L.jpg",
    "pub_date": "2015-01-01",
    "page_count": 195,
    "isbn13": "9781566894098",
    "isbn10": "1566894093",
    "language": "English",
    "formats": ["Paperback", "eBook"],
    "keywords": ["translated fiction", "mexico", "art", "auction", "experimental fiction"],
    "genres": ["fiction", "translated-fiction", "experimental-fiction"],
    "open_library_url": "https://openlibrary.org/isbn/9781566894098",
    "open_library_key": "/books/OL27189906M",
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://coffeehousepress.org/products/the-story-of-my-teeth"},
      {"retailer": "open-library", "url": "https://openlibrary.org/isbn/9781566894098"}
    ],
    "classification": "small_press",
    "confidence": 96,
    "reason": "Coffee House Press is an independent nonprofit publisher; Open Library confirms the ISBN and publisher sources confirm the edition.",
    "evidence_urls": [
      "https://coffeehousepress.org/products/the-story-of-my-teeth",
      "https://openlibrary.org/isbn/9781566894098"
    ]
  },
  {
    "title": "The Hole",
    "slug": "the-hole",
    "subtitle": null,
    "authors": ["Hiroko Oyamada"],
    "author_slug": "hiroko-oyamada",
    "short_bio": "Japanese novelist whose translated fiction uses quiet uncanniness to unsettle domestic and rural life.",
    "long_bio": "Hiroko Oyamada is a Japanese novelist whose translated fiction often uses quiet uncanniness, domestic unease, and altered perception to unsettle ordinary routines. The Hole appeared in English from independent publisher New Directions. This original catalogue bio is based on public publisher and bibliographic metadata.",
    "bio_source": "generated_from_open_library_publisher_metadata",
    "bio_source_url": "https://www.ndbooks.com/book/the-hole/",
    "bio_attribution": "Original catalogue bio based on Open Library and publisher metadata",
    "publisher": "New Directions Publishing",
    "publisher_slug": "new-directions-publishing",
    "publisher_url": "https://www.ndbooks.com/book/the-hole/",
    "description": "A strange, compact Japanese novel about a woman in the countryside whose new domestic routine opens into increasingly uncanny terrain.",
    "cover_url": "https://covers.openlibrary.org/b/isbn/9780811228879-L.jpg",
    "pub_date": "2020-10-06",
    "page_count": 112,
    "isbn13": "9780811228879",
    "isbn10": "0811228878",
    "language": "English",
    "formats": ["Paperback", "eBook"],
    "keywords": ["translated fiction", "japan", "uncanny", "rural life", "domestic fiction"],
    "genres": ["fiction", "translated-fiction", "literary-fiction"],
    "open_library_url": "https://openlibrary.org/isbn/9780811228879",
    "open_library_key": "/books/OL28262619M",
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://www.ndbooks.com/book/the-hole/"},
      {"retailer": "open-library", "url": "https://openlibrary.org/isbn/9780811228879"}
    ],
    "classification": "small_press",
    "confidence": 96,
    "reason": "New Directions is an independent publisher; Open Library confirms the New Directions edition and ISBN.",
    "evidence_urls": [
      "https://www.ndbooks.com/book/the-hole/",
      "https://openlibrary.org/isbn/9780811228879"
    ]
  },
  {
    "title": "Dance of the Jakaranda",
    "slug": "dance-of-the-jakaranda",
    "subtitle": null,
    "authors": ["Peter Kimani"],
    "author_slug": "peter-kimani",
    "short_bio": "Kenyan novelist and journalist whose fiction revisits colonial history, music, and memory.",
    "long_bio": "Peter Kimani is a Kenyan novelist, poet, and journalist whose fiction revisits colonial history, memory, music, and the layered identities produced by empire. Dance of the Jakaranda appeared from independent publisher Akashic Books. This original catalogue bio is based on public publisher and bibliographic metadata.",
    "bio_source": "generated_from_open_library_publisher_metadata",
    "bio_source_url": "https://www.akashicbooks.com/catalog/dance-of-the-jakaranda/",
    "bio_attribution": "Original catalogue bio based on Open Library and publisher metadata",
    "publisher": "Akashic Books",
    "publisher_slug": "akashic-books",
    "publisher_url": "https://www.akashicbooks.com/catalog/dance-of-the-jakaranda/",
    "description": "A Kenyan historical novel about railways, music, colonial inheritance, and a singer whose search through the past reveals buried family and national histories.",
    "cover_url": "https://covers.openlibrary.org/b/isbn/9781617754968-L.jpg",
    "pub_date": "2017-01-01",
    "page_count": 342,
    "isbn13": "9781617754968",
    "isbn10": "161775496X",
    "language": "English",
    "formats": ["Paperback", "eBook"],
    "keywords": ["kenya", "historical fiction", "colonial history", "music", "railway"],
    "genres": ["fiction", "historical-fiction", "african-literature"],
    "open_library_url": "https://openlibrary.org/isbn/9781617754968",
    "open_library_key": "/books/OL27228123M",
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://www.akashicbooks.com/catalog/dance-of-the-jakaranda/"},
      {"retailer": "open-library", "url": "https://openlibrary.org/isbn/9781617754968"}
    ],
    "classification": "small_press",
    "confidence": 95,
    "reason": "Akashic Books is an independent publisher; Open Library confirms the Akashic Books edition and ISBN.",
    "evidence_urls": [
      "https://www.akashicbooks.com/catalog/dance-of-the-jakaranda/",
      "https://openlibrary.org/isbn/9781617754968"
    ]
  }
]$indie_seed$::jsonb) as r(
  title text,
  slug text,
  subtitle text,
  authors jsonb,
  author_slug text,
  short_bio text,
  long_bio text,
  bio_source text,
  bio_source_url text,
  bio_attribution text,
  publisher text,
  publisher_slug text,
  publisher_url text,
  description text,
  cover_url text,
  pub_date date,
  page_count integer,
  isbn13 text,
  isbn10 text,
  language text,
  formats jsonb,
  keywords jsonb,
  genres jsonb,
  open_library_url text,
  open_library_key text,
  retailer_links jsonb,
  classification text,
  confidence integer,
  reason text,
  evidence_urls jsonb
);

insert into public.genres (slug, label) values
  ('poetry', 'Poetry'),
  ('thriller', 'Thriller'),
  ('fiction', 'Fiction'),
  ('nonfiction', 'Nonfiction'),
  ('essays', 'Essays'),
  ('speculative-fiction', 'Speculative Fiction'),
  ('literary-fiction', 'Literary Fiction'),
  ('literary-horror', 'Literary Horror'),
  ('historical-fiction', 'Historical Fiction'),
  ('gothic-fiction', 'Gothic Fiction'),
  ('magical-realism', 'Magical Realism'),
  ('african-literary-fiction', 'African Literary Fiction'),
  ('african-literature', 'African Literature'),
  ('translated-fiction', 'Translated Fiction'),
  ('world-literature', 'World Literature'),
  ('diaspora-literature', 'Diaspora Literature'),
  ('queer-fiction', 'Queer Fiction'),
  ('horror', 'Horror'),
  ('experimental-fiction', 'Experimental Fiction'),
  ('dark-academia', 'Dark Academia'),
  ('psychology', 'Psychology'),
  ('self-help', 'Self-Help'),
  ('trauma', 'Trauma & Healing'),
  ('relationships', 'Relationships')
on conflict (slug) do update set label = excluded.label;

insert into public.retailers (slug, label) values
  ('google-books', 'Google Books'),
  ('open-library', 'Open Library'),
  ('publisher-site', 'Publisher Site')
on conflict (slug) do update set label = excluded.label;

insert into public.publishers (name, slug, description, website_url)
select distinct on (publisher_slug)
  publisher,
  publisher_slug,
  'Independent/small-press or self-publishing imprint seeded from verified book metadata.',
  publisher_url
from _indie20_seed_books
order by publisher_slug, publisher
on conflict (slug) do update set
  name = excluded.name,
  description = coalesce(public.publishers.description, excluded.description),
  website_url = coalesce(public.publishers.website_url, excluded.website_url),
  updated_at = now();

insert into public.authors (
  slug,
  display_name,
  short_bio,
  long_bio,
  bio_source,
  bio_source_url,
  bio_attribution,
  bio_updated_at
)
select
  author_slug,
  authors->>0,
  short_bio,
  long_bio,
  bio_source,
  bio_source_url,
  bio_attribution,
  now()
from _indie20_seed_books
on conflict (slug) do update set
  display_name = excluded.display_name,
  short_bio = coalesce(nullif(public.authors.short_bio, ''), excluded.short_bio),
  long_bio = coalesce(nullif(public.authors.long_bio, ''), excluded.long_bio),
  bio_source = coalesce(nullif(public.authors.bio_source, ''), excluded.bio_source),
  bio_source_url = coalesce(nullif(public.authors.bio_source_url, ''), excluded.bio_source_url),
  bio_attribution = coalesce(nullif(public.authors.bio_attribution, ''), excluded.bio_attribution),
  bio_updated_at = coalesce(public.authors.bio_updated_at, excluded.bio_updated_at);

insert into public.books (
  slug,
  title,
  subtitle,
  pub_date,
  isbn10,
  isbn13,
  description,
  cover_url,
  formats,
  keywords,
  is_published,
  tags,
  rating,
  publisher_id,
  pub_year,
  page_count,
  isbn_13,
  language,
  publisher_name,
  indie_status,
  indie_confidence,
  indie_verified_at,
  indie_source_summary,
  indie_evidence_urls
)
select
  r.slug,
  r.title,
  r.subtitle,
  r.pub_date,
  r.isbn10,
  r.isbn13,
  r.description,
  r.cover_url,
  array(select jsonb_array_elements_text(r.formats)::public.book_format),
  array(select jsonb_array_elements_text(r.keywords)),
  true,
  array['verified-indie', 'indie-discovery'],
  0.0,
  p.id,
  extract(year from r.pub_date)::smallint,
  r.page_count::smallint,
  r.isbn13,
  r.language,
  r.publisher,
  r.classification,
  r.confidence::smallint,
  now(),
  r.reason,
  array(select jsonb_array_elements_text(r.evidence_urls))
from _indie20_seed_books r
left join public.publishers p on p.slug = r.publisher_slug
on conflict (slug) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  pub_date = excluded.pub_date,
  isbn10 = excluded.isbn10,
  isbn13 = excluded.isbn13,
  description = excluded.description,
  cover_url = excluded.cover_url,
  formats = excluded.formats,
  keywords = excluded.keywords,
  is_published = true,
  tags = excluded.tags,
  publisher_id = excluded.publisher_id,
  pub_year = excluded.pub_year,
  page_count = excluded.page_count,
  isbn_13 = excluded.isbn_13,
  language = excluded.language,
  publisher_name = excluded.publisher_name,
  indie_status = excluded.indie_status,
  indie_confidence = excluded.indie_confidence,
  indie_verified_at = excluded.indie_verified_at,
  indie_source_summary = excluded.indie_source_summary,
  indie_evidence_urls = excluded.indie_evidence_urls,
  updated_at = now();

insert into public.books_authors (book_id, author_id, position)
select b.id, a.id, 1
from _indie20_seed_books r
join public.books b on b.slug = r.slug
join public.authors a on a.slug = r.author_slug
on conflict (book_id, author_id) do update set position = excluded.position;

insert into public.books_genres (book_id, genre_id)
select b.id, g.id
from _indie20_seed_books r
join public.books b on b.slug = r.slug
cross join lateral jsonb_array_elements_text(r.genres) genre_slug
join public.genres g on g.slug = genre_slug
on conflict (book_id, genre_id) do nothing;

insert into public.book_retailer_links (book_id, retailer_id, url)
select b.id, ret.id, link->>'url'
from _indie20_seed_books r
join public.books b on b.slug = r.slug
cross join lateral jsonb_array_elements(r.retailer_links) link
join public.retailers ret on ret.slug = link->>'retailer'
where coalesce(link->>'url', '') <> ''
  and not exists (
    select 1
    from public.book_retailer_links existing
    where existing.book_id = b.id
      and existing.retailer_id = ret.id
  );

insert into public.book_assets (book_id, asset_type, url, title)
select b.id, 'cover', r.cover_url, r.title || ' cover'
from _indie20_seed_books r
join public.books b on b.slug = r.slug
where coalesce(r.cover_url, '') <> ''
  and not exists (
    select 1
    from public.book_assets existing
    where existing.book_id = b.id
      and existing.asset_type = 'cover'
      and existing.url = r.cover_url
  );

insert into app_private.book_indie_classification_candidates (
  book_id,
  title,
  slug,
  author_names,
  current_publisher_name,
  detected_publishers,
  detected_isbns,
  classification,
  confidence,
  reason,
  signals,
  source_payload,
  evidence_urls,
  status,
  updated_at
)
select
  b.id,
  r.title,
  r.slug,
  array(select jsonb_array_elements_text(r.authors)),
  r.publisher,
  array[r.publisher],
  array_remove(array[r.isbn13, r.isbn10], null),
  r.classification,
  r.confidence::smallint,
  r.reason,
  jsonb_build_object(
    'seeded', true,
    'publisher_class', case when r.classification = 'self_published' then 'self_published' else 'independent_or_small_press' end,
    'publisher', r.publisher
  ),
  jsonb_build_object(
    'sources', jsonb_build_array('open_library', 'publisher_site'),
    'open_library_url', r.open_library_url,
    'open_library_key', r.open_library_key,
    'publisher_url', r.publisher_url,
    'selected_publisher', r.publisher,
    'selected_isbn13', r.isbn13,
    'selected_isbn10', r.isbn10
  ),
  array(select jsonb_array_elements_text(r.evidence_urls)),
  'applied',
  now()
from _indie20_seed_books r
join public.books b on b.slug = r.slug
on conflict (book_id) do update set
  title = excluded.title,
  slug = excluded.slug,
  author_names = excluded.author_names,
  current_publisher_name = excluded.current_publisher_name,
  detected_publishers = excluded.detected_publishers,
  detected_isbns = excluded.detected_isbns,
  classification = excluded.classification,
  confidence = excluded.confidence,
  reason = excluded.reason,
  signals = excluded.signals,
  source_payload = excluded.source_payload,
  evidence_urls = excluded.evidence_urls,
  status = excluded.status,
  updated_at = now();
