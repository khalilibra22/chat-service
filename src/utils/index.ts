export const getImageUrl = (key: string): string => {
    return `${process.env.S3_READ_URL}/${key}`;
  };
  