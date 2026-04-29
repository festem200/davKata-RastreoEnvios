import { afterEach, describe, expect, it, jest } from '@jest/globals';

import {
  InvalidTrackingResponseError,
  SoapTrackingAdapter,
  TrackingServiceUnavailableError
} from '../../../../src/infrastructure/adapters/soap-tracking.adapter.js';

const originalFetch = globalThis.fetch;

describe('SoapTrackingAdapter', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('calls SOAP service and maps tracking response', async () => {
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      text: async () => `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:trac="http://logiscolombia.com/tracking">
          <soapenv:Body>
            <trac:TrackRouteResponse>
              <routeId>1</routeId>
              <lastLocation>Bogota</lastLocation>
              <progressPercent>40</progressPercent>
              <etaMinutes>1</etaMinutes>
              <timestamp>2026-01-01</timestamp>
            </trac:TrackRouteResponse>
          </soapenv:Body>
        </soapenv:Envelope>`
    } as Response);
    globalThis.fetch = fetchMock;
    const adapter = new SoapTrackingAdapter('http://localhost:8088/mockTrackingBinding');

    const tracking = await adapter.trackRoute('1');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8088/mockTrackingBinding',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('<routeId>1</routeId>')
      })
    );
    expect(tracking).toEqual({
      routeId: '1',
      lastLocation: 'Bogota',
      progressPercent: 40,
      etaMinutes: 1,
      timestamp: '2026-01-01'
    });
  });

  it('throws when SOAP service is unavailable', async () => {
    globalThis.fetch = jest.fn<typeof fetch>().mockRejectedValue(new Error('ECONNREFUSED'));
    const adapter = new SoapTrackingAdapter('http://localhost:8088/mockTrackingBinding');

    await expect(adapter.trackRoute('1')).rejects.toBeInstanceOf(TrackingServiceUnavailableError);
  });

  it('throws when SOAP response is invalid', async () => {
    globalThis.fetch = jest.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      text: async () => '<Envelope><Body/></Envelope>'
    } as Response);
    const adapter = new SoapTrackingAdapter('http://localhost:8088/mockTrackingBinding');

    await expect(adapter.trackRoute('1')).rejects.toBeInstanceOf(InvalidTrackingResponseError);
  });
});
