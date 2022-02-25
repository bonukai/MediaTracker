import axios from 'axios';
import { AudibleLang as AudibleCountryCode } from 'src/entity/configuration';

import { MediaItemForProvider, ExternalIds } from 'src/entity/mediaItem';
import { MetadataProvider } from 'src/metadata/metadataProvider';
import { GlobalConfiguration } from 'src/repository/globalSettings';

export class Audible extends MetadataProvider {
  readonly name = 'audible';
  readonly mediaType = 'audiobook';

  private readonly languages: Record<AudibleCountryCode, string> = {
    au: 'au',
    ca: 'ca',
    de: 'de',
    fr: 'fr',
    in: 'in',
    it: 'it',
    es: 'es',
    jp: 'co.jp',
    uk: 'co.uk',
    us: 'com',
  };

  private countryCode() {
    return GlobalConfiguration.configuration.audibleLang?.toLocaleLowerCase() as AudibleCountryCode;
  }

  private domain(countryCode: AudibleCountryCode) {
    if (countryCode in this.languages) {
      return this.languages[countryCode];
    }

    return this.languages['us'];
  }

  private readonly queryParams = {
    response_groups: ['contributors', 'rating', 'media', 'product_attrs'].join(
      ','
    ),
    image_sizes: [500, 1000, 2400].join(','),
  };

  async search(query: string): Promise<MediaItemForProvider[]> {
    const countryCode = this.countryCode();

    const res = await axios.get<AudibleResponse.SearchResult>(
      `https://api.audible.${this.domain(countryCode)}/1.0/catalog/products`,
      {
        params: {
          title: query,
          num_results: 25,
          products_sort_by: 'Relevance',
          ...this.queryParams,
        },
      }
    );

    if (res.status === 200) {
      return res.data.products.map((product) =>
        this.mapResponse(product, countryCode)
      );
    }

    throw new Error(`Error: ${res.status}`);
  }

  async details(
    arg: ExternalIds & { countryCode?: AudibleCountryCode }
  ): Promise<MediaItemForProvider> {
    const { audibleId } = arg;

    const countryCode =
      arg.countryCode || GlobalConfiguration.configuration.audibleLang;

    const url = `https://api.audible.${this.domain(
      countryCode
    )}/1.0/catalog/products/${audibleId + 1}`;

    const res = await axios.get<AudibleResponse.DetailsResult>(url, {
      params: this.queryParams,
    });

    if (res.status !== 200) {
      throw new Error(`Error: ${res.status}`);
    }

    if (res.data.product?.title === undefined) {
      throw new Error(
        `No metadata from Audible for ID ${audibleId}. Url: ${url}. Response: ${JSON.stringify(
          res.data,
          null,
          2
        )}`
      );
    }

    return this.mapResponse(res.data.product, countryCode);
  }

  private mapResponse(
    item: AudibleResponse.Product,
    countryCode: AudibleCountryCode
  ): MediaItemForProvider {
    return {
      needsDetails: false,
      mediaType: this.mediaType,
      source: this.name,
      audibleCountryCode: countryCode,
      title: item.title,
      audibleId: item.asin,
      authors: item.authors?.map((author) => author.name),
      narrators: item.narrators?.map((narrator) => narrator.name),
      poster: item.product_images?.[2400],
      language: item.language,
      releaseDate: item.release_date,
      runtime: item.runtime_length_min,
      overview: item.merchandising_summary,
    };
  }
}

namespace AudibleResponse {
  export interface Author {
    asin: string;
    name: string;
  }

  export interface AvailableCodec {
    enhanced_codec: string;
    format: string;
    is_kindle_enhanced: boolean;
    name: string;
  }

  export interface Narrator {
    name: string;
  }

  export interface ProductImages {
    500: string;
    1000: string;
    2400: string;
  }

  export interface OverallDistribution {
    average_rating: number;
    display_average_rating: string;
    display_stars: number;
    num_five_star_ratings: number;
    num_four_star_ratings: number;
    num_one_star_ratings: number;
    num_ratings: number;
    num_three_star_ratings: number;
    num_two_star_ratings: number;
  }

  export interface PerformanceDistribution {
    average_rating: number;
    display_average_rating: string;
    display_stars: number;
    num_five_star_ratings: number;
    num_four_star_ratings: number;
    num_one_star_ratings: number;
    num_ratings: number;
    num_three_star_ratings: number;
    num_two_star_ratings: number;
  }

  export interface StoryDistribution {
    average_rating: number;
    display_average_rating: string;
    display_stars: number;
    num_five_star_ratings: number;
    num_four_star_ratings: number;
    num_one_star_ratings: number;
    num_ratings: number;
    num_three_star_ratings: number;
    num_two_star_ratings: number;
  }

  export interface Rating {
    num_reviews: number;
    overall_distribution: OverallDistribution;
    performance_distribution: PerformanceDistribution;
    story_distribution: StoryDistribution;
  }

  export interface Series {
    asin: string;
    sequence: string;
    title: string;
    url: string;
  }

  export interface SocialMediaImages {
    facebook: string;
    twitter: string;
  }

  export interface Product {
    asin: string;
    authors: Author[];
    available_codecs: AvailableCodec[];
    content_delivery_type: string;
    content_type: string;
    format_type: string;
    has_children: boolean;
    is_adult_product: boolean;
    is_listenable: boolean;
    is_purchasability_suppressed: boolean;
    issue_date: string;
    language: string;
    merchandising_summary: string;
    narrators: Narrator[];
    product_images: ProductImages;
    publication_name: string;
    publisher_name: string;
    rating: Rating;
    release_date: string;
    runtime_length_min: number;
    series: Series[];
    sku: string;
    sku_lite: string;
    social_media_images: SocialMediaImages;
    thesaurus_subject_keywords: string[];
    title: string;
    subtitle: string;
    voice_description: string;
  }

  export interface SearchResult {
    products: Product[];
    response_groups: string[];
    total_results: number;
  }

  export interface DetailsResult {
    product: Product;
    response_groups: string[];
  }
}
