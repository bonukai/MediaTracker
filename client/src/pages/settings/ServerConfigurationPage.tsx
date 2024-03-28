import { FC } from 'react';

import { Trans, t } from '@lingui/macro';

import { Button } from '../../components/Button';
import { Form } from '../../components/Form';
import { MainTitle } from '../../components/MainTitle';
import { RouterInput, trpc } from '../../utils/trpc';

export const ServerConfigurationPage: FC = () => {
  const utils = trpc.useUtils();
  const configuration = trpc.configuration.get.useQuery();
  const updateConfiguration = trpc.configuration.update.useMutation({
    onMutate: () => {
      utils.configuration.invalidate();
    },
  });

  if (configuration.isLoading) {
    return <Trans>Loading</Trans>;
  }

  return (
    <>
      <MainTitle
        elements={[
          <Trans>Settings</Trans>,
          <Trans>Server configuration</Trans>,
        ]}
      />
      <div className="flex pt-8 ">
        <Form<RouterInput['configuration']['update']>
          className=""
          initialValues={{
            ...configuration.data,
            publicAddress: configuration.data?.publicAddress || location.origin,
          }}
          convertEmptyStringsToNull={true}
          validation={{
            publicAddress: (value) => {
              if (!value) {
                return {
                  required: true,
                };
              }
              try {
                if (new URL(value).origin === 'null') {
                  return {
                    message: t`invalid URL`,
                  };
                }
              } catch (error) {
                return {
                  message: t`invalid URL`,
                };
              }
            },
          }}
          onSubmit={({ data }) => {
            updateConfiguration.mutate(data);
          }}
        >
          {({ TextInput, SelectInput, CheckboxInput }) => (
            <>
              <TextInput
                inputName="publicAddress"
                title={<Trans>Public URL</Trans>}
                required
              />
              <CheckboxInput
                inputName="enableRegistration"
                title={<Trans>Enable registration</Trans>}
              />
              <CheckboxInput
                inputName="useTvMazeForEpisodeReleaseDates"
                title={<Trans>Use TvMaze API for episode release dates</Trans>}
              />

              <SelectInput
                inputName="audibleLang"
                title={<Trans>Audible language</Trans>}
                options={[
                  { value: 'au', name: 'Australia (English)' },
                  { value: 'ca', name: 'Canada (English)' },
                  { value: 'de', name: 'Deutschland (Deutsch)' },
                  { value: 'es', name: 'España (Castellano)' },
                  { value: 'fr', name: 'France (Français)' },
                  { value: 'in', name: 'India (English)' },
                  { value: 'it', name: 'Italia (Italiano)' },
                  { value: 'uk', name: 'UK (English)' },
                  { value: 'us', name: 'United States (English)' },
                  { value: 'jp', name: '日本 (日本語)' },
                ]}
              />
              <SelectInput
                inputName="tmdbLang"
                title={<Trans>TMDB language</Trans>}
                options={tmdbLanguages.map((item) => ({
                  value: item.code,
                  name: item.name,
                }))}
              />
              <TextInput
                inputName="igdbClientId"
                title={<Trans>IGDB Client ID</Trans>}
              />
              <TextInput
                inputName="igdbClientSecret"
                title={<Trans>IGDB Client Secret</Trans>}
              />
              <SelectInput
                inputName="justWatchCountryCode"
                title={<Trans>JustWatch country</Trans>}
                options={iso.map((item) => ({
                  name: item.country,
                  value: item.code,
                }))}
              />
              <SelectInput
                inputName="digitalReleaseCountryCode"
                title={<Trans>Digital release country</Trans>}
                options={countryOptions}
              />
              <SelectInput
                inputName="theatricalReleaseCountryCode"
                title={<Trans>Theatrical release country</Trans>}
                options={countryOptions}
              />
              <SelectInput
                inputName="physicalReleaseCountryCode"
                title={<Trans>Physical release country</Trans>}
                options={countryOptions}
              />
              <SelectInput
                inputName="tvReleaseCountryCode"
                title={<Trans>TV release country</Trans>}
                options={countryOptions}
              />
              <Button
                actionType="submit"
                text={<Trans>Save</Trans>}
                isLoading={updateConfiguration.isLoading}
              />
            </>
          )}
        </Form>
      </div>
    </>
  );
};

const tmdbLanguages = [
  { code: 'af', name: 'Afrikaans' },
  { code: 'af-ZA', name: 'Afrikaans (South Africa)' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ar-AE', name: 'Arabic (U.A.E.)' },
  { code: 'ar-BH', name: 'Arabic (Bahrain)' },
  { code: 'ar-DZ', name: 'Arabic (Algeria)' },
  { code: 'ar-EG', name: 'Arabic (Egypt)' },
  { code: 'ar-IQ', name: 'Arabic (Iraq)' },
  { code: 'ar-JO', name: 'Arabic (Jordan)' },
  { code: 'ar-KW', name: 'Arabic (Kuwait)' },
  { code: 'ar-LB', name: 'Arabic (Lebanon)' },
  { code: 'ar-LY', name: 'Arabic (Libya)' },
  { code: 'ar-MA', name: 'Arabic (Morocco)' },
  { code: 'ar-OM', name: 'Arabic (Oman)' },
  { code: 'ar-QA', name: 'Arabic (Qatar)' },
  { code: 'ar-SA', name: 'Arabic (Saudi Arabia)' },
  { code: 'ar-SY', name: 'Arabic (Syria)' },
  { code: 'ar-TN', name: 'Arabic (Tunisia)' },
  { code: 'ar-YE', name: 'Arabic (Yemen)' },
  { code: 'az', name: 'Azeri (Latin)' },
  { code: 'az-AZ', name: 'Azeri (Latin) (Azerbaijan)' },
  { code: 'az-AZ', name: 'Azeri (Cyrillic) (Azerbaijan)' },
  { code: 'be', name: 'Belarusian' },
  { code: 'be-BY', name: 'Belarusian (Belarus)' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'bg-BG', name: 'Bulgarian (Bulgaria)' },
  { code: 'bs-BA', name: 'Bosnian (Bosnia and Herzegovina)' },
  { code: 'ca', name: 'Catalan' },
  { code: 'ca-ES', name: 'Catalan (Spain)' },
  { code: 'cs', name: 'Czech' },
  { code: 'cs-CZ', name: 'Czech (Czech Republic)' },
  { code: 'cy', name: 'Welsh' },
  { code: 'cy-GB', name: 'Welsh (United Kingdom)' },
  { code: 'da', name: 'Danish' },
  { code: 'da-DK', name: 'Danish (Denmark)' },
  { code: 'de', name: 'German' },
  { code: 'de-AT', name: 'German (Austria)' },
  { code: 'de-CH', name: 'German (Switzerland)' },
  { code: 'de-DE', name: 'German (Germany)' },
  { code: 'de-LI', name: 'German (Liechtenstein)' },
  { code: 'de-LU', name: 'German (Luxembourg)' },
  { code: 'dv', name: 'Divehi' },
  { code: 'dv-MV', name: 'Divehi (Maldives)' },
  { code: 'el', name: 'Greek' },
  { code: 'el-GR', name: 'Greek (Greece)' },
  { code: 'en', name: 'English' },
  { code: 'en-AU', name: 'English (Australia)' },
  { code: 'en-BZ', name: 'English (Belize)' },
  { code: 'en-CA', name: 'English (Canada)' },
  { code: 'en-CB', name: 'English (Caribbean)' },
  { code: 'en-GB', name: 'English (United Kingdom)' },
  { code: 'en-IE', name: 'English (Ireland)' },
  { code: 'en-JM', name: 'English (Jamaica)' },
  { code: 'en-NZ', name: 'English (New Zealand)' },
  { code: 'en-PH', name: 'English (Republic of the Philippines)' },
  { code: 'en-TT', name: 'English (Trinidad and Tobago)' },
  { code: 'en-US', name: 'English (United States)' },
  { code: 'en-ZA', name: 'English (South Africa)' },
  { code: 'en-ZW', name: 'English (Zimbabwe)' },
  { code: 'eo', name: 'Esperanto' },
  { code: 'es', name: 'Spanish' },
  { code: 'es-AR', name: 'Spanish (Argentina)' },
  { code: 'es-BO', name: 'Spanish (Bolivia)' },
  { code: 'es-CL', name: 'Spanish (Chile)' },
  { code: 'es-CO', name: 'Spanish (Colombia)' },
  { code: 'es-CR', name: 'Spanish (Costa Rica)' },
  { code: 'es-DO', name: 'Spanish (Dominican Republic)' },
  { code: 'es-EC', name: 'Spanish (Ecuador)' },
  { code: 'es-ES', name: 'Spanish (Castilian)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'es-GT', name: 'Spanish (Guatemala)' },
  { code: 'es-HN', name: 'Spanish (Honduras)' },
  { code: 'es-MX', name: 'Spanish (Mexico)' },
  { code: 'es-NI', name: 'Spanish (Nicaragua)' },
  { code: 'es-PA', name: 'Spanish (Panama)' },
  { code: 'es-PE', name: 'Spanish (Peru)' },
  { code: 'es-PR', name: 'Spanish (Puerto Rico)' },
  { code: 'es-PY', name: 'Spanish (Paraguay)' },
  { code: 'es-SV', name: 'Spanish (El Salvador)' },
  { code: 'es-UY', name: 'Spanish (Uruguay)' },
  { code: 'es-VE', name: 'Spanish (Venezuela)' },
  { code: 'et', name: 'Estonian' },
  { code: 'et-EE', name: 'Estonian (Estonia)' },
  { code: 'eu', name: 'Basque' },
  { code: 'eu-ES', name: 'Basque (Spain)' },
  { code: 'fa', name: 'Farsi' },
  { code: 'fa-IR', name: 'Farsi (Iran)' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fi-FI', name: 'Finnish (Finland)' },
  { code: 'fo', name: 'Faroese' },
  { code: 'fo-FO', name: 'Faroese (Faroe Islands)' },
  { code: 'fr', name: 'French' },
  { code: 'fr-BE', name: 'French (Belgium)' },
  { code: 'fr-CA', name: 'French (Canada)' },
  { code: 'fr-CH', name: 'French (Switzerland)' },
  { code: 'fr-FR', name: 'French (France)' },
  { code: 'fr-LU', name: 'French (Luxembourg)' },
  { code: 'fr-MC', name: 'French (Principality of Monaco)' },
  { code: 'gl', name: 'Galician' },
  { code: 'gl-ES', name: 'Galician (Spain)' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'gu-IN', name: 'Gujarati (India)' },
  { code: 'he', name: 'Hebrew' },
  { code: 'he-IL', name: 'Hebrew (Israel)' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hi-IN', name: 'Hindi (India)' },
  { code: 'hr', name: 'Croatian' },
  { code: 'hr-BA', name: 'Croatian (Bosnia and Herzegovina)' },
  { code: 'hr-HR', name: 'Croatian (Croatia)' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'hu-HU', name: 'Hungarian (Hungary)' },
  { code: 'hy', name: 'Armenian' },
  { code: 'hy-AM', name: 'Armenian (Armenia)' },
  { code: 'id', name: 'Indonesian' },
  { code: 'id-ID', name: 'Indonesian (Indonesia)' },
  { code: 'is', name: 'Icelandic' },
  { code: 'is-IS', name: 'Icelandic (Iceland)' },
  { code: 'it', name: 'Italian' },
  { code: 'it-CH', name: 'Italian (Switzerland)' },
  { code: 'it-IT', name: 'Italian (Italy)' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ja-JP', name: 'Japanese (Japan)' },
  { code: 'ka', name: 'Georgian' },
  { code: 'ka-GE', name: 'Georgian (Georgia)' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'kk-KZ', name: 'Kazakh (Kazakhstan)' },
  { code: 'kn', name: 'Kannada' },
  { code: 'kn-IN', name: 'Kannada (India)' },
  { code: 'ko', name: 'Korean' },
  { code: 'ko-KR', name: 'Korean (Korea)' },
  { code: 'kok', name: 'Konkani' },
  { code: 'kok-IN', name: 'Konkani (India)' },
  { code: 'ky', name: 'Kyrgyz' },
  { code: 'ky-KG', name: 'Kyrgyz (Kyrgyzstan)' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'lt-LT', name: 'Lithuanian (Lithuania)' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lv-LV', name: 'Latvian (Latvia)' },
  { code: 'mi', name: 'Maori' },
  { code: 'mi-NZ', name: 'Maori (New Zealand)' },
  { code: 'mk', name: 'FYRO Macedonian' },
  {
    code: 'mk-MK',
    name: 'FYRO Macedonian (Former Yugoslav Republic of Macedonia)',
  },
  { code: 'mn', name: 'Mongolian' },
  { code: 'mn-MN', name: 'Mongolian (Mongolia)' },
  { code: 'mr', name: 'Marathi' },
  { code: 'mr-IN', name: 'Marathi (India)' },
  { code: 'ms', name: 'Malay' },
  { code: 'ms-BN', name: 'Malay (Brunei Darussalam)' },
  { code: 'ms-MY', name: 'Malay (Malaysia)' },
  { code: 'mt', name: 'Maltese' },
  { code: 'mt-MT', name: 'Maltese (Malta)' },
  { code: 'nb', name: 'Norwegian (Bokm?l)' },
  { code: 'nb-NO', name: 'Norwegian (Bokm?l) (Norway)' },
  { code: 'nl', name: 'Dutch' },
  { code: 'nl-BE', name: 'Dutch (Belgium)' },
  { code: 'nl-NL', name: 'Dutch (Netherlands)' },
  { code: 'nn-NO', name: 'Norwegian (Nynorsk) (Norway)' },
  { code: 'ns', name: 'Northern Sotho' },
  { code: 'ns-ZA', name: 'Northern Sotho (South Africa)' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'pa-IN', name: 'Punjabi (India)' },
  { code: 'pl', name: 'Polish' },
  { code: 'pl-PL', name: 'Polish (Poland)' },
  { code: 'ps', name: 'Pashto' },
  { code: 'ps-AR', name: 'Pashto (Afghanistan)' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)' },
  { code: 'qu', name: 'Quechua' },
  { code: 'qu-BO', name: 'Quechua (Bolivia)' },
  { code: 'qu-EC', name: 'Quechua (Ecuador)' },
  { code: 'qu-PE', name: 'Quechua (Peru)' },
  { code: 'ro', name: 'Romanian' },
  { code: 'ro-RO', name: 'Romanian (Romania)' },
  { code: 'ru', name: 'Russian' },
  { code: 'ru-RU', name: 'Russian (Russia)' },
  { code: 'sa', name: 'Sanskrit' },
  { code: 'sa-IN', name: 'Sanskrit (India)' },
  { code: 'se', name: 'Sami (Northern)' },
  { code: 'se-FI', name: 'Sami (Northern) (Finland)' },
  { code: 'se-FI', name: 'Sami (Skolt) (Finland)' },
  { code: 'se-FI', name: 'Sami (Inari) (Finland)' },
  { code: 'se-NO', name: 'Sami (Northern) (Norway)' },
  { code: 'se-NO', name: 'Sami (Lule) (Norway)' },
  { code: 'se-NO', name: 'Sami (Southern) (Norway)' },
  { code: 'se-SE', name: 'Sami (Northern) (Sweden)' },
  { code: 'se-SE', name: 'Sami (Lule) (Sweden)' },
  { code: 'se-SE', name: 'Sami (Southern) (Sweden)' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sk-SK', name: 'Slovak (Slovakia)' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'sl-SI', name: 'Slovenian (Slovenia)' },
  { code: 'sq', name: 'Albanian' },
  { code: 'sq-AL', name: 'Albanian (Albania)' },
  { code: 'sr-BA', name: 'Serbian (Bosnia and Herzegovina)' },
  { code: 'sr-SP', name: 'Serbian (Serbia and Montenegro)' },
  { code: 'sv', name: 'Swedish' },
  { code: 'sv-FI', name: 'Swedish (Finland)' },
  { code: 'sv-SE', name: 'Swedish (Sweden)' },
  { code: 'sw', name: 'Swahili' },
  { code: 'sw-KE', name: 'Swahili (Kenya)' },
  { code: 'syr', name: 'Syriac' },
  { code: 'syr-SY', name: 'Syriac (Syria)' },
  { code: 'ta', name: 'Tamil' },
  { code: 'ta-IN', name: 'Tamil (India)' },
  { code: 'te', name: 'Telugu' },
  { code: 'te-IN', name: 'Telugu (India)' },
  { code: 'th', name: 'Thai' },
  { code: 'th-TH', name: 'Thai (Thailand)' },
  { code: 'tl', name: 'Tagalog' },
  { code: 'tl-PH', name: 'Tagalog (Philippines)' },
  { code: 'tn', name: 'Tswana' },
  { code: 'tn-ZA', name: 'Tswana (South Africa)' },
  { code: 'tr', name: 'Turkish' },
  { code: 'tr-TR', name: 'Turkish (Turkey)' },
  { code: 'tt', name: 'Tatar' },
  { code: 'tt-RU', name: 'Tatar (Russia)' },
  { code: 'ts', name: 'Tsonga' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'uk-UA', name: 'Ukrainian (Ukraine)' },
  { code: 'ur', name: 'Urdu' },
  { code: 'ur-PK', name: 'Urdu (Islamic Republic of Pakistan)' },
  { code: 'uz', name: 'Uzbek' },
  { code: 'uz-UZ', name: 'Uzbek (Uzbekistan)' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'vi-VN', name: 'Vietnamese (Viet Nam)' },
  { code: 'xh', name: 'Xhosa' },
  { code: 'xh-ZA', name: 'Xhosa (South Africa)' },
  { code: 'zh', name: 'Chinese' },
  { code: 'zh-CN', name: 'Chinese (S)' },
  { code: 'zh-HK', name: 'Chinese (Hong Kong)' },
  { code: 'zh-MO', name: 'Chinese (Macau)' },
  { code: 'zh-SG', name: 'Chinese (Singapore)' },
  { code: 'zh-TW', name: 'Chinese (T)' },
  { code: 'zu', name: 'Zulu' },
  { code: 'zu-ZA', name: 'Zulu (South Africa)' },
] as const;

const iso = [
  { code: 'AF', country: 'Afghanistan' },
  { code: 'AX', country: 'Åland Islands' },
  { code: 'AL', country: 'Albania' },
  { code: 'DZ', country: 'Algeria' },
  { code: 'AS', country: 'American Samoa' },
  { code: 'AD', country: 'Andorra' },
  { code: 'AO', country: 'Angola' },
  { code: 'AI', country: 'Anguilla' },
  { code: 'AQ', country: 'Antarctica' },
  { code: 'AG', country: 'Antigua and Barbuda' },
  { code: 'AR', country: 'Argentina' },
  { code: 'AM', country: 'Armenia' },
  { code: 'AW', country: 'Aruba' },
  { code: 'AU', country: 'Australia' },
  { code: 'AT', country: 'Austria' },
  { code: 'AZ', country: 'Azerbaijan' },
  { code: 'BS', country: 'Bahamas' },
  { code: 'BH', country: 'Bahrain' },
  { code: 'BD', country: 'Bangladesh' },
  { code: 'BB', country: 'Barbados' },
  { code: 'BY', country: 'Belarus' },
  { code: 'BE', country: 'Belgium' },
  { code: 'BZ', country: 'Belize' },
  { code: 'BJ', country: 'Benin' },
  { code: 'BM', country: 'Bermuda' },
  { code: 'BT', country: 'Bhutan' },
  { code: 'BO', country: 'Bolivia, Plurinational State of' },
  { code: 'BQ', country: 'Bonaire, Sint Eustatius and Saba' },
  { code: 'BA', country: 'Bosnia and Herzegovina' },
  { code: 'BW', country: 'Botswana' },
  { code: 'BV', country: 'Bouvet Island' },
  { code: 'BR', country: 'Brazil' },
  { code: 'IO', country: 'British Indian Ocean Territory' },
  { code: 'BN', country: 'Brunei Darussalam' },
  { code: 'BG', country: 'Bulgaria' },
  { code: 'BF', country: 'Burkina Faso' },
  { code: 'BI', country: 'Burundi' },
  { code: 'KH', country: 'Cambodia' },
  { code: 'CM', country: 'Cameroon' },
  { code: 'CA', country: 'Canada' },
  { code: 'CV', country: 'Cape Verde' },
  { code: 'KY', country: 'Cayman Islands' },
  { code: 'CF', country: 'Central African Republic' },
  { code: 'TD', country: 'Chad' },
  { code: 'CL', country: 'Chile' },
  { code: 'CN', country: 'China' },
  { code: 'CX', country: 'Christmas Island' },
  { code: 'CC', country: 'Cocos (Keeling) Islands' },
  { code: 'CO', country: 'Colombia' },
  { code: 'KM', country: 'Comoros' },
  { code: 'CG', country: 'Congo' },
  { code: 'CD', country: 'Congo, the Democratic Republic of the' },
  { code: 'CK', country: 'Cook Islands' },
  { code: 'CR', country: 'Costa Rica' },
  { code: 'CI', country: "Côte d'Ivoire" },
  { code: 'HR', country: 'Croatia' },
  { code: 'CU', country: 'Cuba' },
  { code: 'CW', country: 'Curaçao' },
  { code: 'CY', country: 'Cyprus' },
  { code: 'CZ', country: 'Czech Republic' },
  { code: 'DK', country: 'Denmark' },
  { code: 'DJ', country: 'Djibouti' },
  { code: 'DM', country: 'Dominica' },
  { code: 'DO', country: 'Dominican Republic' },
  { code: 'EC', country: 'Ecuador' },
  { code: 'EG', country: 'Egypt' },
  { code: 'SV', country: 'El Salvador' },
  { code: 'GQ', country: 'Equatorial Guinea' },
  { code: 'ER', country: 'Eritrea' },
  { code: 'EE', country: 'Estonia' },
  { code: 'ET', country: 'Ethiopia' },
  { code: 'FK', country: 'Falkland Islands (Malvinas)' },
  { code: 'FO', country: 'Faroe Islands' },
  { code: 'FJ', country: 'Fiji' },
  { code: 'FI', country: 'Finland' },
  { code: 'FR', country: 'France' },
  { code: 'GF', country: 'French Guiana' },
  { code: 'PF', country: 'French Polynesia' },
  { code: 'TF', country: 'French Southern Territories' },
  { code: 'GA', country: 'Gabon' },
  { code: 'GM', country: 'Gambia' },
  { code: 'GE', country: 'Georgia' },
  { code: 'DE', country: 'Germany' },
  { code: 'GH', country: 'Ghana' },
  { code: 'GI', country: 'Gibraltar' },
  { code: 'GR', country: 'Greece' },
  { code: 'GL', country: 'Greenland' },
  { code: 'GD', country: 'Grenada' },
  { code: 'GP', country: 'Guadeloupe' },
  { code: 'GU', country: 'Guam' },
  { code: 'GT', country: 'Guatemala' },
  { code: 'GG', country: 'Guernsey' },
  { code: 'GN', country: 'Guinea' },
  { code: 'GW', country: 'Guinea-Bissau' },
  { code: 'GY', country: 'Guyana' },
  { code: 'HT', country: 'Haiti' },
  { code: 'HM', country: 'Heard Island and McDonald Islands' },
  { code: 'VA', country: 'Holy See (Vatican City State)' },
  { code: 'HN', country: 'Honduras' },
  { code: 'HK', country: 'Hong Kong' },
  { code: 'HU', country: 'Hungary' },
  { code: 'IS', country: 'Iceland' },
  { code: 'IN', country: 'India' },
  { code: 'ID', country: 'Indonesia' },
  { code: 'IR', country: 'Iran, Islamic Republic of' },
  { code: 'IQ', country: 'Iraq' },
  { code: 'IE', country: 'Ireland' },
  { code: 'IM', country: 'Isle of Man' },
  { code: 'IL', country: 'Israel' },
  { code: 'IT', country: 'Italy' },
  { code: 'JM', country: 'Jamaica' },
  { code: 'JP', country: 'Japan' },
  { code: 'JE', country: 'Jersey' },
  { code: 'JO', country: 'Jordan' },
  { code: 'KZ', country: 'Kazakhstan' },
  { code: 'KE', country: 'Kenya' },
  { code: 'KI', country: 'Kiribati' },
  { code: 'KP', country: "Korea, Democratic People's Republic of" },
  { code: 'KR', country: 'Korea, Republic of' },
  { code: 'KW', country: 'Kuwait' },
  { code: 'KG', country: 'Kyrgyzstan' },
  { code: 'LA', country: "Lao People's Democratic Republic" },
  { code: 'LV', country: 'Latvia' },
  { code: 'LB', country: 'Lebanon' },
  { code: 'LS', country: 'Lesotho' },
  { code: 'LR', country: 'Liberia' },
  { code: 'LY', country: 'Libya' },
  { code: 'LI', country: 'Liechtenstein' },
  { code: 'LT', country: 'Lithuania' },
  { code: 'LU', country: 'Luxembourg' },
  { code: 'MO', country: 'Macao' },
  { code: 'MK', country: 'Macedonia, the Former Yugoslav Republic of' },
  { code: 'MG', country: 'Madagascar' },
  { code: 'MW', country: 'Malawi' },
  { code: 'MY', country: 'Malaysia' },
  { code: 'MV', country: 'Maldives' },
  { code: 'ML', country: 'Mali' },
  { code: 'MT', country: 'Malta' },
  { code: 'MH', country: 'Marshall Islands' },
  { code: 'MQ', country: 'Martinique' },
  { code: 'MR', country: 'Mauritania' },
  { code: 'MU', country: 'Mauritius' },
  { code: 'YT', country: 'Mayotte' },
  { code: 'MX', country: 'Mexico' },
  { code: 'FM', country: 'Micronesia, Federated States of' },
  { code: 'MD', country: 'Moldova, Republic of' },
  { code: 'MC', country: 'Monaco' },
  { code: 'MN', country: 'Mongolia' },
  { code: 'ME', country: 'Montenegro' },
  { code: 'MS', country: 'Montserrat' },
  { code: 'MA', country: 'Morocco' },
  { code: 'MZ', country: 'Mozambique' },
  { code: 'MM', country: 'Myanmar' },
  { code: 'NA', country: 'Namibia' },
  { code: 'NR', country: 'Nauru' },
  { code: 'NP', country: 'Nepal' },
  { code: 'NL', country: 'Netherlands' },
  { code: 'NC', country: 'New Caledonia' },
  { code: 'NZ', country: 'New Zealand' },
  { code: 'NI', country: 'Nicaragua' },
  { code: 'NE', country: 'Niger' },
  { code: 'NG', country: 'Nigeria' },
  { code: 'NU', country: 'Niue' },
  { code: 'NF', country: 'Norfolk Island' },
  { code: 'MP', country: 'Northern Mariana Islands' },
  { code: 'NO', country: 'Norway' },
  { code: 'OM', country: 'Oman' },
  { code: 'PK', country: 'Pakistan' },
  { code: 'PW', country: 'Palau' },
  { code: 'PS', country: 'Palestine, State of' },
  { code: 'PA', country: 'Panama' },
  { code: 'PG', country: 'Papua New Guinea' },
  { code: 'PY', country: 'Paraguay' },
  { code: 'PE', country: 'Peru' },
  { code: 'PH', country: 'Philippines' },
  { code: 'PN', country: 'Pitcairn' },
  { code: 'PL', country: 'Poland' },
  { code: 'PT', country: 'Portugal' },
  { code: 'PR', country: 'Puerto Rico' },
  { code: 'QA', country: 'Qatar' },
  { code: 'RE', country: 'Réunion' },
  { code: 'RO', country: 'Romania' },
  { code: 'RU', country: 'Russian Federation' },
  { code: 'RW', country: 'Rwanda' },
  { code: 'BL', country: 'Saint Barthélemy' },
  { code: 'SH', country: 'Saint Helena, Ascension and Tristan da Cunha' },
  { code: 'KN', country: 'Saint Kitts and Nevis' },
  { code: 'LC', country: 'Saint Lucia' },
  { code: 'MF', country: 'Saint Martin (French part)' },
  { code: 'PM', country: 'Saint Pierre and Miquelon' },
  { code: 'VC', country: 'Saint Vincent and the Grenadines' },
  { code: 'WS', country: 'Samoa' },
  { code: 'SM', country: 'San Marino' },
  { code: 'ST', country: 'Sao Tome and Principe' },
  { code: 'SA', country: 'Saudi Arabia' },
  { code: 'SN', country: 'Senegal' },
  { code: 'RS', country: 'Serbia' },
  { code: 'SC', country: 'Seychelles' },
  { code: 'SL', country: 'Sierra Leone' },
  { code: 'SG', country: 'Singapore' },
  { code: 'SX', country: 'Sint Maarten (Dutch part)' },
  { code: 'SK', country: 'Slovakia' },
  { code: 'SI', country: 'Slovenia' },
  { code: 'SB', country: 'Solomon Islands' },
  { code: 'SO', country: 'Somalia' },
  { code: 'ZA', country: 'South Africa' },
  { code: 'GS', country: 'South Georgia and the South Sandwich Islands' },
  { code: 'SS', country: 'South Sudan' },
  { code: 'ES', country: 'Spain' },
  { code: 'LK', country: 'Sri Lanka' },
  { code: 'SD', country: 'Sudan' },
  { code: 'SR', country: 'Suriname' },
  { code: 'SJ', country: 'Svalbard and Jan Mayen' },
  { code: 'SZ', country: 'Swaziland' },
  { code: 'SE', country: 'Sweden' },
  { code: 'CH', country: 'Switzerland' },
  { code: 'SY', country: 'Syrian Arab Republic' },
  { code: 'TW', country: 'Taiwan, Province of China' },
  { code: 'TJ', country: 'Tajikistan' },
  { code: 'TZ', country: 'Tanzania, United Republic of' },
  { code: 'TH', country: 'Thailand' },
  { code: 'TL', country: 'Timor-Leste' },
  { code: 'TG', country: 'Togo' },
  { code: 'TK', country: 'Tokelau' },
  { code: 'TO', country: 'Tonga' },
  { code: 'TT', country: 'Trinidad and Tobago' },
  { code: 'TN', country: 'Tunisia' },
  { code: 'TR', country: 'Turkey' },
  { code: 'TM', country: 'Turkmenistan' },
  { code: 'TC', country: 'Turks and Caicos Islands' },
  { code: 'TV', country: 'Tuvalu' },
  { code: 'UG', country: 'Uganda' },
  { code: 'UA', country: 'Ukraine' },
  { code: 'AE', country: 'United Arab Emirates' },
  { code: 'GB', country: 'United Kingdom' },
  { code: 'US', country: 'United States' },
  { code: 'UM', country: 'United States Minor Outlying Islands' },
  { code: 'UY', country: 'Uruguay' },
  { code: 'UZ', country: 'Uzbekistan' },
  { code: 'VU', country: 'Vanuatu' },
  { code: 'VE', country: 'Venezuela, Bolivarian Republic of' },
  { code: 'VN', country: 'Viet Nam' },
  { code: 'VG', country: 'Virgin Islands, British' },
  { code: 'VI', country: 'Virgin Islands, U.S.' },
  { code: 'WF', country: 'Wallis and Futuna' },
  { code: 'EH', country: 'Western Sahara' },
  { code: 'YE', country: 'Yemen' },
  { code: 'ZM', country: 'Zambia' },
  { code: 'ZW', country: 'Zimbabwe' },
] as const;

const countryOptions = [
  {
    value: '',
    name: (
      <>
        -- <Trans>First global release</Trans> --
      </>
    ),
  },
  ...iso.map((item) => ({
    name: item.country,
    value: item.code,
  })),
];
