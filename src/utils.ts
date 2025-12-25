class MyFetch {
  constructor() {}
  myFetch: <T, R>(
    url: string,
    body?: T,
    options?: RequestInit
  ) => Promise<[Error | null, R | null]> = async (url, body, options) => {
    const { headers, method = "GET", ...restOptions } = options || {};
    let finalUrl = url;
    let requestBody: BodyInit | null | undefined = undefined;

    if (body) {
      if (method.toUpperCase() === "GET") {
        const queryParams = new URLSearchParams();
        Object.keys(body).forEach((key) => {
          queryParams.append(key, String((body as Record<string, any>)[key]));
        });
        finalUrl = `${url}?${queryParams}`;
      } else {
        requestBody = JSON.stringify(body);
      }
    }

    const firstRes = await fetch(finalUrl, {
      method,
      ...restOptions,
      body: requestBody,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...headers,
      },
    });
    const res = await firstRes.json();
    if (res.code !== 0) {
      return [new Error(res.msg), null];
    }

    return [null, res];
  };
  get: <T, R>(
    url: string,
    body?: T,
    options?: RequestInit
  ) => Promise<[Error | null, R | null]> = async (url, body, options) => {
    return this.myFetch(url, body, {
      ...options,
      method: "GET",
    });
  };
  post: <T, R>(
    url: string,
    body?: T,
    options?: RequestInit
  ) => Promise<[Error | null, R | null]> = async (url, body, options) => {
    return this.myFetch(url, body, {
      ...options,
      method: "POST",
    });
  };
}

export const myFetch = new MyFetch();

export function findFromIndex<T>(
  arr: T[],
  startIndex: number,
  predicate: (a: T, i: number, arr: T[]) => boolean
) {
  for (let i = startIndex; i < arr.length; i++) {
    if (predicate(arr[i], i, arr)) {
      return arr[i];
    }
  }
  return undefined;
}
