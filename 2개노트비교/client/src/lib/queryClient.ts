import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  console.log(`🔍 [DEBUG] Response 체크: ${res.url}, Status: ${res.status}, OK: ${res.ok}`);
  
  if (!res.ok) {
    console.log(`❌ [DEBUG] Response 오류 발생, body 읽기 시작`);
    
    // Response를 먼저 clone해야 함 (body를 읽기 전에)
    const clonedResponse = res.clone();
    const text = (await res.text()) || res.statusText;
    
    console.log(`❌ [DEBUG] 오류 내용: ${text}`);
    
    const error: any = new Error(`${res.status}: ${text}`);
    error.response = clonedResponse;
    throw error;
  }
  
  console.log(`✅ [DEBUG] Response 정상`);
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
