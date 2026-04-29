import { XMLParser } from 'fast-xml-parser';

import type { RouteTracking } from '../../domain/entities/route-tracking.js';
import type { TrackingPort } from '../../domain/ports/tracking-port.js';

export class TrackingServiceUnavailableError extends Error {
  constructor(message = 'Servicio de tracking no disponible') {
    super(message);
    this.name = 'TrackingServiceUnavailableError';
  }
}

export class InvalidTrackingResponseError extends Error {
  constructor(message = 'Respuesta de tracking invalida') {
    super(message);
    this.name = 'InvalidTrackingResponseError';
  }
}

const parser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  trimValues: true
});

const getTextValue = (value: unknown): string => {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  throw new InvalidTrackingResponseError();
};

const getNumberValue = (value: unknown): number => {
  const numberValue = Number(getTextValue(value));

  if (!Number.isFinite(numberValue)) {
    throw new InvalidTrackingResponseError();
  }

  return numberValue;
};

export class SoapTrackingAdapter implements TrackingPort {
  constructor(private readonly trackingSoapUrl: string) {}

  async trackRoute(routeId: string): Promise<RouteTracking> {
    const soapRequest = this.buildTrackRouteRequest(routeId);
    let response: Response;

    try {
      response = await fetch(this.trackingSoapUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          SOAPAction: 'TrackRoute'
        },
        body: soapRequest
      });
    } catch {
      throw new TrackingServiceUnavailableError();
    }

    if (!response.ok) {
      throw new TrackingServiceUnavailableError();
    }

    const responseText = await response.text();

    return this.parseTrackRouteResponse(responseText);
  }

  private buildTrackRouteRequest(routeId: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:trac="http://logiscolombia.com/tracking">
  <soapenv:Header/>
  <soapenv:Body>
    <trac:TrackRouteRequest>
      <routeId>${routeId}</routeId>
    </trac:TrackRouteRequest>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  private parseTrackRouteResponse(xml: string): RouteTracking {
    let parsed: unknown;

    try {
      parsed = parser.parse(xml);
    } catch {
      throw new InvalidTrackingResponseError();
    }

    const response = (
      parsed as {
        Envelope?: {
          Body?: {
            TrackRouteResponse?: Record<string, unknown>;
          };
        };
      }
    ).Envelope?.Body?.TrackRouteResponse;

    if (!response) {
      throw new InvalidTrackingResponseError();
    }

    return {
      routeId: getTextValue(response.routeId),
      lastLocation: getTextValue(response.lastLocation),
      progressPercent: getNumberValue(response.progressPercent),
      etaMinutes: getNumberValue(response.etaMinutes),
      timestamp: getTextValue(response.timestamp)
    };
  }
}
