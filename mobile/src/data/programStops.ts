export interface ProgramStop {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
  icon: string;
  location: string;
  locationVisible: 'visible' | 'hidden' | 'tbc';
  description?: string;
  accentColor: string;
  cardType: 'food' | 'activity' | 'party';
  secretLocation?: boolean;
  hideLocation?: boolean;
  hiddenText?: string;
  rules?: string;
  scoring?: string;
}

export const STOPS: ProgramStop[] = [
  {
    id: 'forrat',
    startTime: '15:30',
    endTime: '16:30',
    label: 'Förrätt',
    icon: '🥂',
    location: 'Hos ett värdpar',
    locationVisible: 'visible',
    description: 'Förrätt & kaninens kluring',
    accentColor: '#B87A2A',
    cardType: 'food',
    secretLocation: true,
    hideLocation: true,
  },
  {
    id: 'aktivitet_1',
    startTime: '16:45',
    endTime: '18:00',
    label: 'Gruppaktivitet 1',
    icon: '🌍',
    location: 'Dold plats',
    locationVisible: 'hidden',
    accentColor: '#2A7A5E',
    cardType: 'activity',
    hiddenText: 'En jordglob betyder så mycket',
  },
  {
    id: 'middag',
    startTime: '18:15',
    endTime: '19:30',
    label: 'Middag',
    icon: '🍽️',
    location: 'Hos ett värdpar',
    locationVisible: 'visible',
    description: 'Varmrätt & kaninens kluring',
    accentColor: '#B87A2A',
    cardType: 'food',
    secretLocation: true,
    hideLocation: true,
  },
  {
    id: 'aktivitet_2',
    startTime: '19:45',
    endTime: '20:45',
    label: 'Gruppaktivitet 2',
    icon: '🧳',
    location: 'Dold plats',
    locationVisible: 'hidden',
    accentColor: '#2A7A5E',
    cardType: 'activity',
    hiddenText: 'Jorden runt på sextio minuter',
  },
  {
    id: 'efterratt',
    startTime: '21:00',
    endTime: '22:00',
    label: 'Efterrätt',
    icon: '🍮',
    location: 'Hos ett värdpar',
    locationVisible: 'visible',
    description: 'Efterrätt & kaninens kluring',
    accentColor: '#B87A2A',
    cardType: 'food',
    secretLocation: true,
    hideLocation: true,
  },
  {
    id: 'avslutningsfesten',
    startTime: '22:00',
    endTime: '01:00',
    label: 'Avslutningsfesten',
    icon: '🐷',
    location: 'Dold plats',
    locationVisible: 'hidden',
    description: 'Den stora grisfesten',
    accentColor: '#1C4F4A',
    cardType: 'party',
    hideLocation: true,
  },
];
