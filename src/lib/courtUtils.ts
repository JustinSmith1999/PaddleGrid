interface Court {
  name: string;
  [key: string]: any;
}

export function sortCourtsByNumber<T extends Court>(courts: T[]): T[] {
  return [...courts].sort((a, b) => {
    const getCourtNumber = (name: string): number => {
      const match = name.match(/#(\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }

      if (name.toLowerCase().includes('championship')) {
        return 0;
      }

      return 999;
    };

    const numA = getCourtNumber(a.name);
    const numB = getCourtNumber(b.name);

    return numA - numB;
  });
}
