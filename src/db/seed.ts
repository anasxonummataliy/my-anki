import * as Crypto from 'expo-crypto';

export interface SeedData {
  decks: {
    id: string;
    name: string;
    description: string;
    parentId?: string | null;
    color: string;
  }[];
  words: {
    id: string;
    deckId: string;
    word: string;
    translation: string;
    definition: string;
    example: string;
    partOfSpeech: string;
    notes?: string;
  }[];
}

const parentDeckId = 'deck-4000-essential';
const unit1Id = 'deck-unit-1';
const unit2Id = 'deck-unit-2';
const unit3Id = 'deck-unit-3';
const businessDeckId = 'deck-business';
const ieltsDeckId = 'deck-ielts';
const customDeckId = 'deck-custom';

export const INITIAL_SEED: SeedData = {
  decks: [
    {
      id: parentDeckId,
      name: '4000 Essential English Words',
      description: 'Foundational vocabulary for everyday fluency and reading comprehension',
      parentId: null,
      color: '#FF5E1E',
    },
    {
      id: unit1Id,
      name: 'Unit 1',
      description: 'Essential words for describing nature, actions, and emotions',
      parentId: parentDeckId,
      color: '#FF7A3D',
    },
    {
      id: unit2Id,
      name: 'Unit 2',
      description: 'Vocabulary for conversation, thinking, and academic discussion',
      parentId: parentDeckId,
      color: '#FF9800',
    },
    {
      id: unit3Id,
      name: 'Unit 3',
      description: 'Advanced daily expressions and descriptive verbs',
      parentId: parentDeckId,
      color: '#0EA5E9',
    },
    {
      id: businessDeckId,
      name: 'Business English',
      description: 'Professional terminology for meetings, negotiation, and corporate communications',
      parentId: null,
      color: '#10B981',
    },
    {
      id: ieltsDeckId,
      name: 'IELTS Vocabulary',
      description: 'Academic band 7-9 vocabulary and collocations for IELTS preparation',
      parentId: null,
      color: '#8B5CF6',
    },
    {
      id: customDeckId,
      name: 'Custom Deck',
      description: 'Personal custom vocabulary words and everyday idioms',
      parentId: null,
      color: '#0EA5E9',
    },
  ],
  words: [
    // Unit 1
    {
      id: 'word-afraid',
      deckId: unit1Id,
      word: 'afraid',
      translation: 'qoʻrqqan',
      definition: 'feeling fear or anxiety; frightened',
      example: 'The child was afraid of the dark room.',
      partOfSpeech: 'adjective',
      notes: 'Synonyms: scared, fearful',
    },
    {
      id: 'word-agree',
      deckId: unit1Id,
      word: 'agree',
      translation: 'rozi boʻlmoq',
      definition: 'to have the same opinion, or to accept a suggestion',
      example: 'We both agree that learning vocabulary requires daily practice.',
      partOfSpeech: 'verb',
    },
    {
      id: 'word-arrive',
      deckId: unit1Id,
      word: 'arrive',
      translation: 'yetib kelmoq',
      definition: 'to reach a place, especially at the end of a journey',
      example: 'The high-speed train will arrive in Samarkand at noon.',
      partOfSpeech: 'verb',
    },
    {
      id: 'word-clever',
      deckId: unit1Id,
      word: 'clever',
      translation: 'aqlli, ziyrak',
      definition: 'quick to understand, learn, and devise or apply ideas',
      example: 'The clever student solved the puzzle in minutes.',
      partOfSpeech: 'adjective',
    },
    {
      id: 'word-hide',
      deckId: unit1Id,
      word: 'hide',
      translation: 'yashirmoq, yashirinmoq',
      definition: 'to put or keep out of sight',
      example: 'The cat likes to hide under the warm blanket.',
      partOfSpeech: 'verb',
    },
    {
      id: 'word-hunt',
      deckId: unit1Id,
      word: 'hunt',
      translation: 'ov qilmoq, qidirmoq',
      definition: 'to pursue and kill animals, or search determinedly for something',
      example: 'Owls hunt small rodents during the night.',
      partOfSpeech: 'verb',
    },
    {
      id: 'word-lot',
      deckId: unit1Id,
      word: 'a lot',
      translation: 'koʻp',
      definition: 'a large amount or quantity',
      example: 'There are a lot of interesting words to master.',
      partOfSpeech: 'phrase',
    },
    {
      id: 'word-promise',
      deckId: unit1Id,
      word: 'promise',
      translation: 'va’da bermoq',
      definition: 'to state firmly that you will definitely do something',
      example: 'He promised to review his flashcards every morning.',
      partOfSpeech: 'verb',
    },
    {
      id: 'word-reply',
      deckId: unit1Id,
      word: 'reply',
      translation: 'javob bermoq',
      definition: 'to say or write something as an answer',
      example: 'She replied with a warm smile when asked about her progress.',
      partOfSpeech: 'verb',
    },
    {
      id: 'word-safe',
      deckId: unit1Id,
      word: 'safe',
      translation: 'xavfsiz',
      definition: 'protected from or not exposed to danger or risk',
      example: 'Your vocabulary data is completely safe on your device.',
      partOfSpeech: 'adjective',
    },

    // Unit 2
    {
      id: 'word-adventure',
      deckId: unit2Id,
      word: 'adventure',
      translation: 'sarguzasht',
      definition: 'an unusual and exciting, typically hazardous, experience or activity',
      example: 'Traveling through Central Asia was an unforgettable adventure.',
      partOfSpeech: 'noun',
    },
    {
      id: 'word-approach',
      deckId: unit2Id,
      word: 'approach',
      translation: 'yaqinlashmoq',
      definition: 'to come near or nearer to someone or something in distance or time',
      example: 'As exam day approaches, consistent revision becomes vital.',
      partOfSpeech: 'verb',
    },
    {
      id: 'word-chemical',
      deckId: unit2Id,
      word: 'chemical',
      translation: 'kimyoviy modda',
      definition: 'any substance that has a defined composition',
      example: 'Scientists handled the chemical with protective gloves.',
      partOfSpeech: 'noun',
    },
    {
      id: 'word-create',
      deckId: unit2Id,
      word: 'create',
      translation: 'yaratmoq',
      definition: 'to bring something into existence through effort or imagination',
      example: 'You can create custom decks for any subject.',
      partOfSpeech: 'verb',
    },
    {
      id: 'word-evil',
      deckId: unit2Id,
      word: 'evil',
      translation: 'yovuz, yomon',
      definition: 'profoundly immoral and wicked',
      example: 'The fairy tale villain had an evil laugh.',
      partOfSpeech: 'adjective',
    },
    {
      id: 'word-experiment',
      deckId: unit2Id,
      word: 'experiment',
      translation: 'tajriba',
      definition: 'a scientific procedure undertaken to make a discovery or test a hypothesis',
      example: 'The chemistry experiment proved successful on the first try.',
      partOfSpeech: 'noun',
    },
    {
      id: 'word-kill',
      deckId: unit2Id,
      word: 'kill',
      translation: 'oʻldirmoq',
      definition: 'to cause the death of a person, animal, or other living thing',
      example: 'Extreme cold can kill delicate garden plants.',
      partOfSpeech: 'verb',
    },
    {
      id: 'word-laboratory',
      deckId: unit2Id,
      word: 'laboratory',
      translation: 'laboratoriya',
      definition: 'a room or building equipped for scientific experiments or research',
      example: 'The researcher spent hours analyzing samples in the laboratory.',
      partOfSpeech: 'noun',
    },
    {
      id: 'word-laugh',
      deckId: unit2Id,
      word: 'laugh',
      translation: 'kulmoq',
      definition: 'to make spontaneous sounds showing amusement or joy',
      example: 'Everyone laughed at the funny ending of the story.',
      partOfSpeech: 'verb',
    },
    {
      id: 'word-loud',
      deckId: unit2Id,
      word: 'loud',
      translation: 'baland ovozli',
      definition: 'producing or capable of producing much noise',
      example: 'A loud thunder startled everyone in the room.',
      partOfSpeech: 'adjective',
    },

    // Travel Deck
    {
      id: 'word-departure',
      deckId: customDeckId,
      word: 'departure',
      translation: 'joʻnab ketish',
      definition: 'the act of leaving in a plane, train, or car',
      example: 'Please check the departure board for gate changes.',
      partOfSpeech: 'noun',
    },
    {
      id: 'word-destination',
      deckId: customDeckId,
      word: 'destination',
      translation: 'manzil',
      definition: 'the place to which someone or something is going or being sent',
      example: 'Tashkent was our final destination.',
      partOfSpeech: 'noun',
    },
    {
      id: 'word-itinerary',
      deckId: customDeckId,
      word: 'itinerary',
      translation: 'sayohat rejasi / marshrut',
      definition: 'a planned route or journey',
      example: 'Our travel itinerary includes Bukhara, Khiva, and Fergana.',
      partOfSpeech: 'noun',
    },
    {
      id: 'word-luggage',
      deckId: customDeckId,
      word: 'luggage',
      translation: 'yuk, chamadonlar',
      definition: 'suitcases or other bags in which to pack personal belongings for traveling',
      example: 'Make sure your luggage has a clear name tag.',
      partOfSpeech: 'noun',
    },
    {
      id: 'word-reservation',
      deckId: customDeckId,
      word: 'reservation',
      translation: 'bron qilish, buyurtma',
      definition: 'an arrangement to secure a seat, room, or ticket in advance',
      example: 'I made a hotel reservation two weeks ago.',
      partOfSpeech: 'noun',
    },
  ],
};
