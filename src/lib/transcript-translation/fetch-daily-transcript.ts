import 'server-only';

interface DailyTranscriptAccessLinkResponse {
  download_link?: string;
  link?: string;
}

/**
 * Fetch WebVTT text for a Daily transcript id via the signed access-link endpoint.
 */
export async function fetchDailyTranscriptVtt(
  transcriptId: string,
  apiKey: string,
): Promise<string> {
  const accessResponse = await fetch(
    `https://api.daily.co/v1/transcript/${encodeURIComponent(transcriptId)}/access-link`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );

  if (!accessResponse.ok) {
    const body = await accessResponse.text();
    throw new Error(
      `Daily transcript access-link failed: ${accessResponse.status} ${body}`,
    );
  }

  const accessPayload = (await accessResponse.json()) as DailyTranscriptAccessLinkResponse;
  const downloadUrl = accessPayload.download_link ?? accessPayload.link;
  if (!downloadUrl) {
    throw new Error('Daily transcript access-link response missing download_link');
  }

  const vttResponse = await fetch(downloadUrl);
  if (!vttResponse.ok) {
    const body = await vttResponse.text();
    throw new Error(`Daily transcript download failed: ${vttResponse.status} ${body}`);
  }

  return vttResponse.text();
}
