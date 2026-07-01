-- Seed another verified independent/small-press discovery batch.
-- Source metadata was checked against Google Books, Open Library, and publisher
-- or award pages where available. Catalogue descriptions and bios are original.

create temporary table _verified_indie_seed_books on commit drop as
select *
from jsonb_to_recordset($indie_seed$[
  {
    "title": "They Can't Kill Us Until They Kill Us",
    "slug": "they-cant-kill-us-until-they-kill-us",
    "subtitle": "Essays",
    "authors": ["Hanif Abdurraqib"],
    "author_slug": "hanif-abdurraqib",
    "short_bio": "Poet, essayist, and cultural critic writing across music, grief, sport, and Black life.",
    "long_bio": "Hanif Abdurraqib is a poet, essayist, and cultural critic whose work moves between music, memory, sports, grief, and Black cultural life. His essays and poems are known for combining close attention to art with emotional candor and social observation. This original catalogue bio is based on public bibliographic and publisher metadata.",
    "bio_source": "generated_from_google_books_open_library_publisher_metadata",
    "bio_source_url": "https://twodollarradio.com/products/they-cant-kill-us",
    "bio_attribution": "Original catalogue bio based on Google Books, Open Library, and publisher metadata",
    "publisher": "Two Dollar Radio",
    "publisher_slug": "two-dollar-radio",
    "publisher_url": "https://twodollarradio.com/products/they-cant-kill-us",
    "description": "A searching essay collection about music, fandom, grief, race, and American life, first published by independent press Two Dollar Radio.",
    "cover_url": "https://covers.openlibrary.org/b/id/13157813-L.jpg",
    "pub_date": "2017-11-14",
    "page_count": 236,
    "isbn13": "9781937512651",
    "isbn10": "1937512657",
    "language": "English",
    "formats": ["Paperback", "eBook"],
    "keywords": ["essays", "music", "culture", "race", "grief", "criticism"],
    "genres": ["nonfiction", "essays", "music-writing"],
    "google_books_url": "https://www.googleapis.com/books/v1/volumes?q=intitle%3AThey+Can%27t+Kill+Us+Until+They+Kill+Us+inauthor%3AHanif+Abdurraqib",
    "google_info_link": "https://play.google.com/store/books/details?id=u8vnDwAAQBAJ&source=gbs_api",
    "open_library_url": "https://openlibrary.org/works/OL19722174W",
    "open_library_key": "/works/OL19722174W",
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://twodollarradio.com/products/they-cant-kill-us"},
      {"retailer": "google-books", "url": "https://play.google.com/store/books/details?id=u8vnDwAAQBAJ&source=gbs_api"},
      {"retailer": "open-library", "url": "https://openlibrary.org/works/OL19722174W"}
    ],
    "evidence_urls": [
      "https://twodollarradio.com/products/they-cant-kill-us",
      "https://play.google.com/store/books/details?id=u8vnDwAAQBAJ&source=gbs_api",
      "https://openlibrary.org/works/OL19722174W"
    ],
    "classification": "small_press",
    "confidence": 95,
    "reason": "Two Dollar Radio is an independent press; Open Library and publisher metadata match title, author, and original publication."
  },
  {
    "title": "The Wallcreeper",
    "slug": "the-wallcreeper",
    "subtitle": null,
    "authors": ["Nell Zink"],
    "author_slug": "nell-zink",
    "short_bio": "Novelist whose debut, The Wallcreeper, appeared from Dorothy, a Publishing Project.",
    "long_bio": "Nell Zink is a novelist whose work is known for sharp comedy, ecological tension, and restless social observation. The Wallcreeper was her debut novel and was published by Dorothy, a Publishing Project, an independent press. This original catalogue bio is based on public bibliographic and publisher metadata.",
    "bio_source": "generated_from_google_books_open_library_publisher_metadata",
    "bio_source_url": "https://dorothyproject.com/book/nell-zinks-the-wallcreeper/",
    "bio_attribution": "Original catalogue bio based on Google Books, Open Library, and publisher metadata",
    "publisher": "Dorothy, a Publishing Project",
    "publisher_slug": "dorothy-a-publishing-project",
    "publisher_url": "https://dorothyproject.com/book/nell-zinks-the-wallcreeper/",
    "description": "A compact, mordant novel of marriage, migration, birds, politics, and ecological unease from independent press Dorothy.",
    "cover_url": "https://books.google.com/books/content?id=hCpcEAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
    "pub_date": "2014-10-01",
    "page_count": 200,
    "isbn13": "9780989760713",
    "isbn10": "0989760715",
    "language": "English",
    "formats": ["Paperback", "eBook"],
    "keywords": ["literary fiction", "ecology", "marriage", "satire", "debut"],
    "genres": ["fiction", "literary-fiction"],
    "google_books_url": "https://www.googleapis.com/books/v1/volumes?q=intitle%3AThe+Wallcreeper+inauthor%3ANell+Zink",
    "google_info_link": "https://play.google.com/store/books/details?id=hCpcEAAAQBAJ&source=gbs_api",
    "open_library_url": "https://openlibrary.org/works/OL19985165W",
    "open_library_key": "/works/OL19985165W",
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://dorothyproject.com/book/nell-zinks-the-wallcreeper/"},
      {"retailer": "google-books", "url": "https://play.google.com/store/books/details?id=hCpcEAAAQBAJ&source=gbs_api"},
      {"retailer": "open-library", "url": "https://openlibrary.org/works/OL19985165W"}
    ],
    "evidence_urls": [
      "https://dorothyproject.com/book/nell-zinks-the-wallcreeper/",
      "https://play.google.com/store/books/details?id=hCpcEAAAQBAJ&source=gbs_api",
      "https://openlibrary.org/works/OL19985165W"
    ],
    "classification": "small_press",
    "confidence": 95,
    "reason": "Dorothy, a Publishing Project is an independent press; publisher, Google Books, and Open Library metadata match title and author."
  },
  {
    "title": "The Babysitter at Rest",
    "slug": "the-babysitter-at-rest",
    "subtitle": null,
    "authors": ["Jen George"],
    "author_slug": "jen-george",
    "short_bio": "Writer and artist whose story collection The Babysitter at Rest was published by Dorothy.",
    "long_bio": "Jen George is a writer and artist whose fiction leans into surreal social pressure, performance, and the strange rituals of contemporary life. The Babysitter at Rest, her first book, was published by Dorothy, a Publishing Project. This original catalogue bio is based on public bibliographic and publisher metadata.",
    "bio_source": "generated_from_google_books_open_library_publisher_metadata",
    "bio_source_url": "https://dorothyproject.com/book/the-babysitter-at-rest/",
    "bio_attribution": "Original catalogue bio based on Google Books, Open Library, and publisher metadata",
    "publisher": "Dorothy, a Publishing Project",
    "publisher_slug": "dorothy-a-publishing-project",
    "publisher_url": "https://dorothyproject.com/book/the-babysitter-at-rest/",
    "description": "A surreal, funny, and unnerving collection of long stories about femininity, artifice, ambition, and social performance.",
    "cover_url": "https://books.google.com/books/content?id=lCpcEAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
    "pub_date": "2016-10-17",
    "page_count": 168,
    "isbn13": "9780997366624",
    "isbn10": "0997366621",
    "language": "English",
    "formats": ["Paperback", "eBook"],
    "keywords": ["short stories", "surrealism", "femininity", "experimental fiction"],
    "genres": ["fiction", "experimental-fiction"],
    "google_books_url": "https://www.googleapis.com/books/v1/volumes?q=intitle%3AThe+Babysitter+at+Rest+inauthor%3AJen+George",
    "google_info_link": "https://play.google.com/store/books/details?id=lCpcEAAAQBAJ&source=gbs_api",
    "open_library_url": "https://openlibrary.org/works/OL20042286W",
    "open_library_key": "/works/OL20042286W",
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://dorothyproject.com/book/the-babysitter-at-rest/"},
      {"retailer": "google-books", "url": "https://play.google.com/store/books/details?id=lCpcEAAAQBAJ&source=gbs_api"},
      {"retailer": "open-library", "url": "https://openlibrary.org/works/OL20042286W"}
    ],
    "evidence_urls": [
      "https://dorothyproject.com/book/the-babysitter-at-rest/",
      "https://play.google.com/store/books/details?id=lCpcEAAAQBAJ&source=gbs_api",
      "https://openlibrary.org/works/OL20042286W"
    ],
    "classification": "small_press",
    "confidence": 95,
    "reason": "Dorothy, a Publishing Project is an independent press; publisher, Google Books, and Open Library metadata match title and author."
  },
  {
    "title": "In the Distance",
    "slug": "in-the-distance",
    "subtitle": null,
    "authors": ["Hernan Diaz"],
    "author_slug": "hernan-diaz",
    "short_bio": "Novelist whose debut In the Distance was first published by Coffee House Press.",
    "long_bio": "Hernan Diaz is a novelist whose work often reconsiders myth, wealth, migration, and the stories nations tell about themselves. His debut novel, In the Distance, was first published by Coffee House Press and became a major literary prize finalist. This original catalogue bio is based on public bibliographic, award, and publisher metadata.",
    "bio_source": "generated_from_open_library_award_publisher_metadata",
    "bio_source_url": "https://www.pulitzer.org/finalists/hernan-diaz",
    "bio_attribution": "Original catalogue bio based on Open Library, Pulitzer, and publisher metadata",
    "publisher": "Coffee House Press",
    "publisher_slug": "coffee-house-press",
    "publisher_url": "https://www.pulitzer.org/finalists/hernan-diaz",
    "description": "A spare, mythic western about migration, isolation, and reinvention, first published by independent press Coffee House Press.",
    "cover_url": "https://covers.openlibrary.org/b/id/8757651-L.jpg",
    "pub_date": "2017-10-10",
    "page_count": 256,
    "isbn13": "9781566894883",
    "isbn10": "1566894883",
    "language": "English",
    "formats": ["Paperback", "eBook"],
    "keywords": ["western", "migration", "historical fiction", "literary fiction"],
    "genres": ["fiction", "historical-fiction", "literary-fiction"],
    "google_books_url": "https://www.googleapis.com/books/v1/volumes?q=intitle%3AIn+the+Distance+inauthor%3AHernan+Diaz",
    "google_info_link": "http://books.google.pt/books?id=J38IEQAAQBAJ&dq=intitle:In+the+Distance+inauthor:Hernan+Diaz&hl=&source=gbs_api",
    "open_library_url": "https://openlibrary.org/works/OL19721019W",
    "open_library_key": "/works/OL19721019W",
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://www.pulitzer.org/finalists/hernan-diaz"},
      {"retailer": "google-books", "url": "http://books.google.pt/books?id=J38IEQAAQBAJ&dq=intitle:In+the+Distance+inauthor:Hernan+Diaz&hl=&source=gbs_api"},
      {"retailer": "open-library", "url": "https://openlibrary.org/works/OL19721019W"}
    ],
    "evidence_urls": [
      "https://www.pulitzer.org/finalists/hernan-diaz",
      "http://books.google.pt/books?id=J38IEQAAQBAJ&dq=intitle:In+the+Distance+inauthor:Hernan+Diaz&hl=&source=gbs_api",
      "https://openlibrary.org/works/OL19721019W"
    ],
    "classification": "small_press",
    "confidence": 94,
    "reason": "Coffee House Press is an independent press; Open Library and Pulitzer metadata identify Coffee House Press for the title."
  },
  {
    "title": "I Hotel",
    "slug": "i-hotel",
    "subtitle": null,
    "authors": ["Karen Tei Yamashita"],
    "author_slug": "karen-tei-yamashita",
    "short_bio": "Novelist and professor emerita known for formally adventurous Asian American literature.",
    "long_bio": "Karen Tei Yamashita is a novelist and professor emerita whose work blends historical research, political memory, formal experiment, and Asian American literary traditions. I Hotel, published by Coffee House Press, is one of her major works. This original catalogue bio is based on public bibliographic and publisher metadata.",
    "bio_source": "generated_from_google_books_open_library_publisher_metadata",
    "bio_source_url": "https://coffeehousepress.org/pages/authors/karen-tei-yamashita",
    "bio_attribution": "Original catalogue bio based on Google Books, Open Library, and publisher metadata",
    "publisher": "Coffee House Press",
    "publisher_slug": "coffee-house-press",
    "publisher_url": "https://coffeehousepress.org/products/i-hotel-reissue",
    "description": "A sweeping experimental novel of Asian American activism, community, and political struggle across a transformative decade.",
    "cover_url": "https://covers.openlibrary.org/b/id/9777152-L.jpg",
    "pub_date": "2010-06-01",
    "page_count": 613,
    "isbn13": "9781566892391",
    "isbn10": "1566892392",
    "language": "English",
    "formats": ["Paperback", "eBook"],
    "keywords": ["asian american literature", "historical fiction", "activism", "experimental fiction"],
    "genres": ["fiction", "historical-fiction", "experimental-fiction"],
    "google_books_url": "https://www.googleapis.com/books/v1/volumes?q=intitle%3AI+Hotel+inauthor%3AKaren+Tei+Yamashita",
    "google_info_link": "http://books.google.pt/books?id=R_i2AQAACAAJ&dq=intitle:I+Hotel+inauthor:Karen+Tei+Yamashita&hl=&source=gbs_api",
    "open_library_url": "https://openlibrary.org/works/OL18710644W",
    "open_library_key": "/works/OL18710644W",
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://coffeehousepress.org/products/i-hotel-reissue"},
      {"retailer": "google-books", "url": "http://books.google.pt/books?id=R_i2AQAACAAJ&dq=intitle:I+Hotel+inauthor:Karen+Tei+Yamashita&hl=&source=gbs_api"},
      {"retailer": "open-library", "url": "https://openlibrary.org/works/OL18710644W"}
    ],
    "evidence_urls": [
      "https://coffeehousepress.org/products/i-hotel-reissue",
      "http://books.google.pt/books?id=R_i2AQAACAAJ&dq=intitle:I+Hotel+inauthor:Karen+Tei+Yamashita&hl=&source=gbs_api",
      "https://openlibrary.org/works/OL18710644W"
    ],
    "classification": "small_press",
    "confidence": 94,
    "reason": "Coffee House Press is an independent press; Open Library and publisher metadata match title, author, and publisher."
  },
  {
    "title": "Minor Detail",
    "slug": "minor-detail",
    "subtitle": null,
    "authors": ["Adania Shibli"],
    "author_slug": "adania-shibli",
    "short_bio": "Palestinian writer whose fiction works through memory, violence, place, and narrative gaps.",
    "long_bio": "Adania Shibli is a Palestinian writer of novels, essays, and short fiction. Her work often turns on memory, violence, displacement, and the unstable relationship between recorded history and private experience. Minor Detail appeared in English from New Directions. This original catalogue bio is based on public bibliographic and publisher metadata.",
    "bio_source": "generated_from_google_books_open_library_publisher_metadata",
    "bio_source_url": "https://www.ndbooks.com/book/minor-detail/",
    "bio_attribution": "Original catalogue bio based on Google Books, Open Library, and publisher metadata",
    "publisher": "New Directions Publishing",
    "publisher_slug": "new-directions-publishing",
    "publisher_url": "https://www.ndbooks.com/book/minor-detail/",
    "description": "A taut translated novel about memory, state violence, and the pressure of trying to recover what official history leaves out.",
    "cover_url": "https://covers.openlibrary.org/b/id/10097948-L.jpg",
    "pub_date": "2020-05-19",
    "page_count": 136,
    "isbn13": "9780811229074",
    "isbn10": "0811229076",
    "language": "English",
    "formats": ["Paperback", "eBook"],
    "keywords": ["translated fiction", "palestinian literature", "memory", "history"],
    "genres": ["fiction", "translated-fiction", "literary-fiction"],
    "google_books_url": "https://www.googleapis.com/books/v1/volumes?q=intitle%3AMinor+Detail+inauthor%3AAdania+Shibli",
    "google_info_link": "http://books.google.pt/books?id=pkvNEQAAQBAJ&dq=intitle:Minor+Detail+inauthor:Adania+Shibli&hl=&source=gbs_api",
    "open_library_url": "https://openlibrary.org/works/OL20801026W",
    "open_library_key": "/works/OL20801026W",
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://www.ndbooks.com/book/minor-detail/"},
      {"retailer": "google-books", "url": "http://books.google.pt/books?id=pkvNEQAAQBAJ&dq=intitle:Minor+Detail+inauthor:Adania+Shibli&hl=&source=gbs_api"},
      {"retailer": "open-library", "url": "https://openlibrary.org/works/OL20801026W"}
    ],
    "evidence_urls": [
      "https://www.ndbooks.com/book/minor-detail/",
      "http://books.google.pt/books?id=pkvNEQAAQBAJ&dq=intitle:Minor+Detail+inauthor:Adania+Shibli&hl=&source=gbs_api",
      "https://openlibrary.org/works/OL20801026W"
    ],
    "classification": "small_press",
    "confidence": 94,
    "reason": "New Directions is an independent publisher; publisher, Open Library, and Google Books metadata match title and author."
  },
  {
    "title": "The Factory",
    "slug": "the-factory",
    "subtitle": null,
    "authors": ["Hiroko Oyamada"],
    "author_slug": "hiroko-oyamada",
    "short_bio": "Japanese fiction writer whose English-language work often turns ordinary systems uncanny.",
    "long_bio": "Hiroko Oyamada is a Japanese fiction writer whose stories and novellas often transform ordinary work, domestic life, and institutional routines into quietly uncanny territory. The Factory was her English-language debut from New Directions. This original catalogue bio is based on public bibliographic and publisher metadata.",
    "bio_source": "generated_from_google_books_publisher_metadata",
    "bio_source_url": "https://www.ndbooks.com/book/the-factory/",
    "bio_attribution": "Original catalogue bio based on Google Books and publisher metadata",
    "publisher": "New Directions Publishing",
    "publisher_slug": "new-directions-publishing",
    "publisher_url": "https://www.ndbooks.com/book/the-factory/",
    "description": "A strange workplace novella in which three employees enter a vast factory whose routines steadily reshape their sense of reality.",
    "cover_url": "https://books.google.com/books/content?id=ga6NDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
    "pub_date": "2019-10-29",
    "page_count": 119,
    "isbn13": "9780811228862",
    "isbn10": "081122886X",
    "language": "English",
    "formats": ["Paperback", "eBook"],
    "keywords": ["translated fiction", "workplace", "japanese literature", "uncanny"],
    "genres": ["fiction", "translated-fiction", "speculative-fiction"],
    "google_books_url": "https://www.googleapis.com/books/v1/volumes?q=intitle%3AThe+Factory+inauthor%3AHiroko+Oyamada",
    "google_info_link": "https://play.google.com/store/books/details?id=ga6NDwAAQBAJ&source=gbs_api",
    "open_library_url": null,
    "open_library_key": null,
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://www.ndbooks.com/book/the-factory/"},
      {"retailer": "google-books", "url": "https://play.google.com/store/books/details?id=ga6NDwAAQBAJ&source=gbs_api"}
    ],
    "evidence_urls": [
      "https://www.ndbooks.com/book/the-factory/",
      "https://play.google.com/store/books/details?id=ga6NDwAAQBAJ&source=gbs_api"
    ],
    "classification": "small_press",
    "confidence": 93,
    "reason": "New Directions is an independent publisher; publisher and Google Books metadata match title, author, and English-language edition."
  },
  {
    "title": "Hurricane Season",
    "slug": "hurricane-season",
    "subtitle": null,
    "authors": ["Fernanda Melchor"],
    "author_slug": "fernanda-melchor",
    "short_bio": "Mexican novelist and journalist whose fiction is known for intensity, rhythm, and social critique.",
    "long_bio": "Fernanda Melchor is a Mexican novelist and journalist whose fiction is known for its intensity, long rhythms, and unsparing attention to violence, class, gender, and myth in contemporary Mexico. Hurricane Season appeared in English from New Directions. This original catalogue bio is based on public bibliographic and publisher metadata.",
    "bio_source": "generated_from_google_books_publisher_metadata",
    "bio_source_url": "https://www.ndbooks.com/book/hurricane-season/",
    "bio_attribution": "Original catalogue bio based on Google Books and publisher metadata",
    "publisher": "New Directions Publishing",
    "publisher_slug": "new-directions-publishing",
    "publisher_url": "https://www.ndbooks.com/book/hurricane-season/",
    "description": "A fierce translated novel of rumor, violence, poverty, and myth, told through the broken stories surrounding a murder.",
    "cover_url": "https://books.google.com/books/content?id=hbbDDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
    "pub_date": "2020-10-06",
    "page_count": 213,
    "isbn13": "9780811228046",
    "isbn10": "0811228045",
    "language": "English",
    "formats": ["Paperback", "eBook"],
    "keywords": ["translated fiction", "mexican literature", "violence", "literary fiction"],
    "genres": ["fiction", "translated-fiction", "literary-fiction"],
    "google_books_url": "https://www.googleapis.com/books/v1/volumes?q=intitle%3AHurricane+Season+inauthor%3AFernanda+Melchor",
    "google_info_link": "http://books.google.pt/books?id=hbbDDwAAQBAJ&dq=intitle:Hurricane+Season+inauthor:Fernanda+Melchor&hl=&source=gbs_api",
    "open_library_url": null,
    "open_library_key": null,
    "retailer_links": [
      {"retailer": "publisher-site", "url": "https://www.ndbooks.com/book/hurricane-season/"},
      {"retailer": "google-books", "url": "http://books.google.pt/books?id=hbbDDwAAQBAJ&dq=intitle:Hurricane+Season+inauthor:Fernanda+Melchor&hl=&source=gbs_api"}
    ],
    "evidence_urls": [
      "https://www.ndbooks.com/book/hurricane-season/",
      "http://books.google.pt/books?id=hbbDDwAAQBAJ&dq=intitle:Hurricane+Season+inauthor:Fernanda+Melchor&hl=&source=gbs_api"
    ],
    "classification": "small_press",
    "confidence": 93,
    "reason": "New Directions is an independent publisher; publisher and Google Books metadata match title, author, and English-language edition."
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
  google_books_url text,
  google_info_link text,
  open_library_url text,
  open_library_key text,
  retailer_links jsonb,
  evidence_urls jsonb,
  classification text,
  confidence integer,
  reason text
);

insert into public.genres (slug, label) values
  ('essays', 'Essays'),
  ('experimental-fiction', 'Experimental Fiction'),
  ('historical-fiction', 'Historical Fiction'),
  ('literary-fiction', 'Literary Fiction'),
  ('music-writing', 'Music Writing'),
  ('translated-fiction', 'Translated Fiction')
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
  'Independent/small-press publisher seeded from verified book metadata.',
  publisher_url
from _verified_indie_seed_books
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
from _verified_indie_seed_books
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
  array['verified-indie', 'small-press', 'indie-discovery'],
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
from _verified_indie_seed_books r
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
from _verified_indie_seed_books r
join public.books b on b.slug = r.slug
join public.authors a on a.slug = r.author_slug
on conflict (book_id, author_id) do update set position = excluded.position;

insert into public.books_genres (book_id, genre_id)
select b.id, g.id
from _verified_indie_seed_books r
join public.books b on b.slug = r.slug
cross join lateral jsonb_array_elements_text(r.genres) genre_slug
join public.genres g on g.slug = genre_slug
on conflict (book_id, genre_id) do nothing;

insert into public.book_retailer_links (book_id, retailer_id, url)
select b.id, ret.id, link->>'url'
from _verified_indie_seed_books r
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
from _verified_indie_seed_books r
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
    'publisher_class', 'independent_or_small_press',
    'publisher', r.publisher
  ),
  jsonb_build_object(
    'sources', jsonb_build_array('google_books', 'open_library', 'publisher_or_award_page'),
    'google_books_url', r.google_books_url,
    'google_info_link', r.google_info_link,
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
from _verified_indie_seed_books r
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
