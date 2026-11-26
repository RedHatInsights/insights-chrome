import axios from 'axios';
import { captureException } from '@sentry/react';
import { atom } from 'jotai';
import { unwrap } from 'jotai/utils';
import { languageAtom } from './languageAtom';
import { FeoMessages } from '../../utils/feoLocalization';

export type FeoLocale = { id: string; name: string; file?: string };
const STATIC_PATH = '/api/chrome-service/v1/static';
const ENGLISH_MESSAGES: FeoMessages = {};

function reportLocaleFailure(asset: string, error: unknown) {
  captureException(error instanceof Error ? error : new Error('FEO locale asset unavailable'), {
    level: 'warning',
    tags: { area: 'feo-localization', asset },
  });
}

export const advertisedFeoLocalesAtom = atom(async (): Promise<FeoLocale[]> => {
  try {
    const { data } = await axios.get<unknown>(`${STATIC_PATH}/locales.json`);
    if (!Array.isArray(data)) throw new Error('locales.json: invalid manifest');
    const valid = data.filter(
      (entry): entry is FeoLocale =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof entry.id === 'string' &&
        typeof entry.name === 'string' &&
        (entry.id === 'en' || (/^[a-zA-Z0-9-]+$/.test(entry.id) && entry.file === `messages.${entry.id}.json`))
    );
    if (valid.length !== data.length) reportLocaleFailure('locales.json', new Error('locales.json: invalid locale entries'));
    return valid;
  } catch (error) {
    reportLocaleFailure('locales.json', error);
    // Optional assets: old publishers and outages must leave English usable.
    return [];
  }
});

export const feoLocalizationEnabledAtom = atom(false);

const asyncFeoMessagesAtom = atom(async (get): Promise<FeoMessages> => {
  if (!get(feoLocalizationEnabledAtom)) return ENGLISH_MESSAGES;
  const locale = get(languageAtom);
  if (locale === 'en') return ENGLISH_MESSAGES;
  const advertised = await get(advertisedFeoLocalesAtom);
  const entry = advertised.find(({ id }) => id === locale);
  if (!entry?.file) return ENGLISH_MESSAGES;
  try {
    const { data } = await axios.get<unknown>(`${STATIC_PATH}/${entry.file}`);
    if (typeof data !== 'object' || data === null || Array.isArray(data)) throw new Error(`${entry.file}: invalid catalog`);
    const valid = Object.entries(data).filter((entry): entry is [string, string] => typeof entry[1] === 'string');
    if (valid.length !== Object.keys(data).length) reportLocaleFailure(entry.file, new Error(`${entry.file}: non-string translations`));
    return Object.fromEntries(valid);
  } catch (error) {
    reportLocaleFailure(entry.file, error);
    return ENGLISH_MESSAGES;
  }
});

// unwrap exposes only the current dependency's result. A slow previous locale
// cannot publish over a newer selection; loading/missing assets render English.
export const feoMessagesAtom = unwrap(asyncFeoMessagesAtom, () => ENGLISH_MESSAGES);
