/**
 * Complete, RFC-compliant HTTP Status Code Database & Utilities
 * Sources: RFC 9110 (HTTP Semantics), RFC 6585, RFC 7231, RFC 7725, RFC 8297, RFC 8470, WebDAV (RFC 4918)
 */

export const STATUS_CATEGORIES = [
  { 
    id: 'all', 
    label: 'All Codes', 
    range: '100–599', 
    color: 'indigo', 
    description: 'Complete registry of HTTP response codes.' 
  },
  { 
    id: '1xx', 
    label: '1xx Informational', 
    range: '100–199', 
    color: 'blue', 
    description: 'Request received, continuing process.' 
  },
  { 
    id: '2xx', 
    label: '2xx Success', 
    range: '200–299', 
    color: 'emerald', 
    description: 'Action successfully received, understood, and accepted.' 
  },
  { 
    id: '3xx', 
    label: '3xx Redirection', 
    range: '300–399', 
    color: 'amber', 
    description: 'Further action must be taken to complete request.' 
  },
  { 
    id: '4xx', 
    label: '4xx Client Error', 
    range: '400–499', 
    color: 'rose', 
    description: 'Request contains bad syntax or cannot be fulfilled.' 
  },
  { 
    id: '5xx', 
    label: '5xx Server Error', 
    range: '500–599', 
    color: 'purple', 
    description: 'Server failed to fulfill an apparently valid request.' 
  },
  { 
    id: 'unofficial', 
    label: 'Unofficial & Edge', 
    range: 'CDN / Nginx', 
    color: 'cyan', 
    description: 'Edge network, Cloudflare, and reverse-proxy extension codes.' 
  }
];

export const HTTP_STATUS_CODES = [
  // ================= 1xx Informational =================
  {
    code: 100,
    name: 'Continue',
    category: '1xx',
    categoryName: 'Informational',
    summary: 'Client should proceed to send the request body.',
    description: 'An interim response indicating that the server has received the request headers and that the client should proceed to send the body (or ignore if already sent). Typically used with the "Expect: 100-continue" header.',
    rfc: 'RFC 9110, §15.2.1',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.2.1',
    cacheable: false,
    cacheableNote: '1xx responses are never cacheable.',
    commonCauses: [
      'Client sent "Expect: 100-continue" before uploading large payload.',
      'Server verified authorization/headers and is ready to ingest request stream.'
    ],
    howToFix: 'Normal protocol negotiation. The client should begin transmitting the message body after receiving 100 Continue.',
    headers: [
      { header: 'Expect', description: 'Client header requesting 100-continue agreement before uploading.', example: '100-continue' }
    ],
    exampleResponse: {
      status: 100,
      statusText: 'Continue',
      headers: {
        'Server': 'nginx/1.24.0',
        'Date': new Date().toUTCString()
      },
      body: null
    }
  },
  {
    code: 101,
    name: 'Switching Protocols',
    category: '1xx',
    categoryName: 'Informational',
    summary: 'Server agrees to switch application protocols (e.g. HTTP to WebSocket).',
    description: 'Sent in response to an Upgrade request header from the client. Indicates the protocol the server is switching to, such as WebSocket or HTTP/2.',
    rfc: 'RFC 9110, §15.2.2',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.2.2',
    cacheable: false,
    cacheableNote: 'Non-cacheable interim protocol handshake.',
    commonCauses: [
      'WebSocket connection handshake (Upgrade: websocket).',
      'TLS / HTTP protocol version negotiation.'
    ],
    howToFix: 'Ensure client handles the switched protocol (e.g. framing WebSocket messages) instead of HTTP.',
    headers: [
      { header: 'Upgrade', description: 'Protocol being switched to.', example: 'websocket' },
      { header: 'Connection', description: 'Connection control flag.', example: 'Upgrade' },
      { header: 'Sec-WebSocket-Accept', description: 'WebSocket handshake verification key.', example: 's3pPLMBiTxaQ9kYGzzhZRbK+xOo=' }
    ],
    exampleResponse: {
      status: 101,
      statusText: 'Switching Protocols',
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Accept': 'HSmrc0sMlYUkAGmm5OPpG2HaGWk='
      },
      body: null
    }
  },
  {
    code: 102,
    name: 'Processing',
    category: '1xx',
    categoryName: 'Informational',
    summary: 'Server has received and is processing request, but no response is available yet.',
    description: 'A WebDAV status code sent to prevent the client from timing out while a complex multi-step batch or sub-request is executing on the server.',
    rfc: 'RFC 2518 (WebDAV), §10.1',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc2518#section-10.1',
    cacheable: false,
    cacheableNote: 'Interim heartbeat status; not cacheable.',
    commonCauses: [
      'Long-running WebDAV operations involving multiple files or transactions.'
    ],
    howToFix: 'Wait for server to finish processing and transmit the final 2xx/4xx/5xx response.',
    headers: [],
    exampleResponse: {
      status: 102,
      statusText: 'Processing',
      headers: { 'Date': new Date().toUTCString() },
      body: null
    }
  },
  {
    code: 103,
    name: 'Early Hints',
    category: '1xx',
    categoryName: 'Informational',
    summary: 'Allows preloading critical resources before the final response is prepared.',
    description: 'Used to return response headers (such as Link for preloading CSS, JS, and fonts) while the server is still computing the final response.',
    rfc: 'RFC 8297',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc8297',
    cacheable: false,
    cacheableNote: 'Interim hint; browser handles preconnect/preload directives.',
    commonCauses: [
      'Optimizing Web Vitals (LCP/FCP) by having CDN/edge send early resource link headers.'
    ],
    howToFix: 'Client browsers begin fetching specified resources in Link headers immediately.',
    headers: [
      { header: 'Link', description: 'Resource preload directive.', example: '</style.css>; rel=preload; as=style' }
    ],
    exampleResponse: {
      status: 103,
      statusText: 'Early Hints',
      headers: {
        'Link': '</main.css>; rel=preload; as=style, </app.js>; rel=preload; as=script'
      },
      body: null
    }
  },

  // ================= 2xx Success =================
  {
    code: 200,
    name: 'OK',
    category: '2xx',
    categoryName: 'Success',
    summary: 'The request has succeeded.',
    description: 'Standard response for successful HTTP requests. The actual meaning depends on the HTTP method: GET returns the resource entity, HEAD returns entity headers, POST returns an action result.',
    rfc: 'RFC 9110, §15.3.1',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.3.1',
    cacheable: true,
    cacheableNote: 'Cacheable by default unless overridden by Cache-Control headers.',
    commonCauses: [
      'Successful GET query returning data.',
      'Successful POST/PUT update returning updated resource payload.'
    ],
    howToFix: 'No fix needed; desired outcome.',
    headers: [
      { header: 'Content-Type', description: 'MIME type of returned entity body.', example: 'application/json; charset=utf-8' },
      { header: 'ETag', description: 'Entity validator token.', example: '"33a64df551425fcc"' },
      { header: 'Cache-Control', description: 'Caching directives.', example: 'public, max-age=3600' }
    ],
    exampleResponse: {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'application/json',
        'ETag': 'W/"68-bK2d1F"',
        'Cache-Control': 'max-age=60'
      },
      body: {
        success: true,
        data: {
          id: 'usr_849204',
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          role: 'administrator'
        }
      }
    }
  },
  {
    code: 201,
    name: 'Created',
    category: '2xx',
    categoryName: 'Success',
    summary: 'The request succeeded and a new resource has been created.',
    description: 'The primary resource created is identified by either a Location header field in the response or by the target URI. Typically sent in response to POST or PUT requests.',
    rfc: 'RFC 9110, §15.3.2',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.3.2',
    cacheable: false,
    cacheableNote: 'Not cacheable by default.',
    commonCauses: [
      'Successful resource creation via POST (e.g. creating a user, placing an order).',
      'Successful resource initialization via PUT.'
    ],
    howToFix: 'Always include a Location header pointing to the canonical URI of the newly created resource.',
    headers: [
      { header: 'Location', description: 'Absolute or relative URI of newly created resource.', example: '/api/v1/users/usr_849204' },
      { header: 'Content-Type', description: 'Representation format.', example: 'application/json' }
    ],
    exampleResponse: {
      status: 201,
      statusText: 'Created',
      headers: {
        'Location': '/api/v1/orders/ord_9942',
        'Content-Type': 'application/json'
      },
      body: {
        id: 'ord_9942',
        status: 'pending_payment',
        amount: 89.95,
        currency: 'USD',
        createdAt: '2026-10-30T13:30:00Z'
      }
    }
  },
  {
    code: 202,
    name: 'Accepted',
    category: '2xx',
    categoryName: 'Success',
    summary: 'Request accepted for background processing, but execution is not complete.',
    description: 'The request has been accepted for processing, but the processing has not been completed. Useful for asynchronous operations, worker queues, and batch jobs without requiring the client to wait indefinitely.',
    rfc: 'RFC 9110, §15.3.3',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.3.3',
    cacheable: false,
    cacheableNote: 'Non-cacheable status.',
    commonCauses: [
      'Enqueueing background jobs (e.g. video rendering, report generation, webhooks).',
      'Long-running operations handled by asynchronous workers.'
    ],
    howToFix: 'Include a polling status endpoint or Location header where the client can query progress.',
    headers: [
      { header: 'Location', description: 'Status URL to poll for job progress.', example: '/api/v1/jobs/job_49810/status' }
    ],
    exampleResponse: {
      status: 202,
      statusText: 'Accepted',
      headers: {
        'Location': '/api/v1/exports/exp_331/status',
        'Retry-After': '10',
        'Content-Type': 'application/json'
      },
      body: {
        jobId: 'exp_331',
        status: 'queued',
        estimatedSeconds: 15,
        statusUrl: '/api/v1/exports/exp_331/status'
      }
    }
  },
  {
    code: 203,
    name: 'Non-Authoritative Information',
    category: '2xx',
    categoryName: 'Success',
    summary: 'Request succeeded, but payload was modified by a proxy/intermediary.',
    description: 'Indicates the request was successful, but the enclosed payload was modified from that of the origin server\'s 200 OK response by a transforming proxy.',
    rfc: 'RFC 9110, §15.3.4',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.3.4',
    cacheable: true,
    cacheableNote: 'Cacheable by default.',
    commonCauses: [
      'Edge proxies re-compressing or stripping headers from origin responses.'
    ],
    howToFix: 'Normal behavior when caching proxies or CDNs inject metadata.',
    headers: [],
    exampleResponse: {
      status: 203,
      statusText: 'Non-Authoritative Information',
      headers: { 'Warning': '199 - "Proxy modified content"' },
      body: { message: 'Transformed by edge CDN proxy' }
    }
  },
  {
    code: 204,
    name: 'No Content',
    category: '2xx',
    categoryName: 'Success',
    summary: 'The request succeeded, but there is no body payload to return.',
    description: 'The server has fulfilled the request and there is no additional content to send in the response body. Commonly used for DELETE operations, PUT updates without return payload, or CORS preflight responses.',
    rfc: 'RFC 9110, §15.3.5',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.3.5',
    cacheable: true,
    cacheableNote: 'Cacheable by default, though rarely cached.',
    commonCauses: [
      'Successful DELETE request.',
      'Successful PUT or PATCH where the client does not need an updated representation.',
      'OPTIONS preflight response.'
    ],
    howToFix: 'Ensure the server does NOT include a message body or Content-Length > 0.',
    headers: [],
    exampleResponse: {
      status: 204,
      statusText: 'No Content',
      headers: {
        'Date': new Date().toUTCString(),
        'X-Request-Id': 'req_98124'
      },
      body: null
    }
  },
  {
    code: 205,
    name: 'Reset Content',
    category: '2xx',
    categoryName: 'Success',
    summary: 'Request succeeded; client should reset the document view (e.g. clear form).',
    description: 'Informs the client to reset the document which sent the request (e.g., clear input form fields after user submission).',
    rfc: 'RFC 9110, §15.3.6',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.3.6',
    cacheable: false,
    cacheableNote: 'Must not be cached.',
    commonCauses: [
      'Form submission reset handler.'
    ],
    howToFix: 'Client application should clear input fields upon receiving 205.',
    headers: [],
    exampleResponse: {
      status: 205,
      statusText: 'Reset Content',
      headers: {},
      body: null
    }
  },
  {
    code: 206,
    name: 'Partial Content',
    category: '2xx',
    categoryName: 'Success',
    summary: 'Server fulfilled a partial GET request specified by the Range header.',
    description: 'Sent in response to a Range header sent by the client. Used for streaming video/audio, paused downloads, and chunked byte-range file fetching.',
    rfc: 'RFC 9110, §15.3.7',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.3.7',
    cacheable: true,
    cacheableNote: 'Cacheable when combined with matching ETag and range indicators.',
    commonCauses: [
      'Streaming HTML5 audio/video elements seeking forward.',
      'Resuming interrupted file downloads.'
    ],
    howToFix: 'Ensure Content-Range header specifies the exact byte offsets and total size.',
    headers: [
      { header: 'Content-Range', description: 'Specifies byte span and total length.', example: 'bytes 0-1023/409600' },
      { header: 'Accept-Ranges', description: 'Advertises range support.', example: 'bytes' }
    ],
    exampleResponse: {
      status: 206,
      statusText: 'Partial Content',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Range': 'bytes 1000-2999/849200',
        'Content-Length': '2000'
      },
      body: '[Binary video byte stream 1000-2999]'
    }
  },
  {
    code: 207,
    name: 'Multi-Status',
    category: '2xx',
    categoryName: 'Success',
    summary: 'WebDAV multi-status response containing distinct statuses for multiple resources.',
    description: 'An XML message body containing multiple separate response codes for operations affecting multiple files or sub-resources.',
    rfc: 'RFC 4918 (WebDAV), §11.1',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc4918#section-11.1',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: ['WebDAV PROPFIND or bulk file actions.'],
    howToFix: 'Inspect child XML elements inside the multi-status payload.',
    headers: [{ header: 'Content-Type', description: 'XML body payload.', example: 'application/xml; charset=utf-8' }],
    exampleResponse: {
      status: 207,
      statusText: 'Multi-Status',
      headers: { 'Content-Type': 'application/xml' },
      body: '<multistatus xmlns="DAV:"><response><href>/item1</href><status>HTTP/1.1 200 OK</status></response></multistatus>'
    }
  },

  // ================= 3xx Redirection =================
  {
    code: 300,
    name: 'Multiple Choices',
    category: '3xx',
    categoryName: 'Redirection',
    summary: 'Request has multiple representations available; client must choose one.',
    description: 'The target resource has more than one representation, each with its own specific identifier and negotiation metadata. Client can choose its preferred representation.',
    rfc: 'RFC 9110, §15.4.1',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.4.1',
    cacheable: true,
    cacheableNote: 'Cacheable by default.',
    commonCauses: ['Content negotiation across multiple video formats, languages, or file types.'],
    howToFix: 'Provide a list of representations and URIs in the body or Link headers.',
    headers: [],
    exampleResponse: {
      status: 300,
      statusText: 'Multiple Choices',
      headers: { 'Content-Type': 'application/json' },
      body: {
        choices: [
          { format: 'json', url: '/data.json' },
          { format: 'csv', url: '/data.csv' },
          { format: 'xml', url: '/data.xml' }
        ]
      }
    }
  },
  {
    code: 301,
    name: 'Moved Permanently',
    category: '3xx',
    categoryName: 'Redirection',
    summary: 'Target resource has been assigned a new permanent URI.',
    description: 'The target resource has been permanently assigned a new URI. Search engines will transfer link equity (PageRank) to the new URI. WARNING: Historically, user agents may change POST to GET when following a 301 redirect. Use 308 if the HTTP method must be preserved.',
    rfc: 'RFC 9110, §15.4.2',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.4.2',
    cacheable: true,
    cacheableNote: 'Heuristically cacheable unless specified otherwise.',
    commonCauses: [
      'Migrating from HTTP to HTTPS.',
      'Canonical domain redirects (e.g. non-www to www or apex domain).',
      'Permanently updated URL structure.'
    ],
    howToFix: 'Update bookmarks, links, and search indexes to target the new Location URL.',
    headers: [
      { header: 'Location', description: 'The new permanent URI.', example: 'https://example.com/new-path' }
    ],
    exampleResponse: {
      status: 301,
      statusText: 'Moved Permanently',
      headers: {
        'Location': 'https://example.com/docs/api-v2',
        'Cache-Control': 'public, max-age=86400'
      },
      body: null
    }
  },
  {
    code: 302,
    name: 'Found',
    category: '3xx',
    categoryName: 'Redirection',
    summary: 'Target resource resides temporarily under a different URI.',
    description: 'Previously named "Moved Temporarily". The target resource temporarily resides under a different URI. Because the redirect might be altered on occasion, the client ought to continue to use the effective request URI for future requests.',
    rfc: 'RFC 9110, §15.4.3',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.4.3',
    cacheable: false,
    cacheableNote: 'Not cacheable unless explicitly indicated with Cache-Control.',
    commonCauses: [
      'Post-Redirect-Get pattern after web form submission.',
      'Temporary maintenance or seasonal landing page redirects.'
    ],
    howToFix: 'Clients follow the Location header. Use 307 if the HTTP method must be guaranteed not to change.',
    headers: [
      { header: 'Location', description: 'Temporary redirect destination.', example: '/dashboard' }
    ],
    exampleResponse: {
      status: 302,
      statusText: 'Found',
      headers: {
        'Location': '/login?redirect=%2Fdashboard'
      },
      body: null
    }
  },
  {
    code: 303,
    name: 'See Other',
    category: '3xx',
    categoryName: 'Redirection',
    summary: 'Redirect destination can be retrieved using a GET method.',
    description: 'Directs the client to the newly referenced resource using a GET request regardless of the original request method. Ideal for POST-Redirect-GET patterns to prevent accidental form re-submission on page refresh.',
    rfc: 'RFC 9110, §15.4.4',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.4.4',
    cacheable: false,
    cacheableNote: 'Not cacheable; subsequent GET response may be cacheable.',
    commonCauses: [
      'After payment processing or form creation, redirecting user to receipt page.',
      'Preventing double-submission of web forms.'
    ],
    howToFix: 'Client issues a GET request to the URI provided in Location.',
    headers: [
      { header: 'Location', description: 'Destination URI for subsequent GET.', example: '/orders/ord_102/confirmation' }
    ],
    exampleResponse: {
      status: 303,
      statusText: 'See Other',
      headers: {
        'Location': '/receipts/rec_891'
      },
      body: null
    }
  },
  {
    code: 304,
    name: 'Not Modified',
    category: '3xx',
    categoryName: 'Redirection',
    summary: 'Resource has not been modified since the version specified in request headers.',
    description: 'Indicates that the condition evaluated to false in a conditional GET or HEAD request (using If-None-Match or If-Modified-Since). The client can use its cached copy, saving bandwidth and latency.',
    rfc: 'RFC 9110, §15.4.5',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.4.5',
    cacheable: true,
    cacheableNote: 'Affirms that client cache entry is valid and should be freshened.',
    commonCauses: [
      'Client sent "If-None-Match: [etag]" matching the server current ETag.',
      'Client sent "If-Modified-Since" and resource was not touched.'
    ],
    howToFix: 'Client reads content directly from local browser/HTTP cache without downloading body.',
    headers: [
      { header: 'ETag', description: 'Updated or verified entity tag.', example: 'W/"4f2a-992"' },
      { header: 'Cache-Control', description: 'Updated caching freshness directives.', example: 'max-age=3600' }
    ],
    exampleResponse: {
      status: 304,
      statusText: 'Not Modified',
      headers: {
        'ETag': '"33a64df551425fcc"',
        'Cache-Control': 'public, max-age=3600'
      },
      body: null
    }
  },
  {
    code: 307,
    name: 'Temporary Redirect',
    category: '3xx',
    categoryName: 'Redirection',
    summary: 'Target resource resides temporarily at another URI; MUST NOT change HTTP method.',
    description: 'Similar to 302 Found, EXCEPT the client MUST NOT change the request method when following the redirect (e.g. POST requests MUST stay POST).',
    rfc: 'RFC 9110, §15.4.8',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.4.8',
    cacheable: false,
    cacheableNote: 'Not cacheable by default.',
    commonCauses: [
      'Temporary endpoint rerouting where POST/PUT payloads must not be silently turned into GET.'
    ],
    howToFix: 'Ensure client resends original body payload and method to the Location URL.',
    headers: [
      { header: 'Location', description: 'Temporary destination URI.', example: 'https://cluster-b.api.internal/v1/upload' }
    ],
    exampleResponse: {
      status: 307,
      statusText: 'Temporary Redirect',
      headers: {
        'Location': 'https://node2.api.service/webhook'
      },
      body: null
    }
  },
  {
    code: 308,
    name: 'Permanent Redirect',
    category: '3xx',
    categoryName: 'Redirection',
    summary: 'Target resource has moved permanently; MUST NOT change HTTP method.',
    description: 'Similar to 301 Moved Permanently, EXCEPT the client MUST NOT change the request method when redirecting (e.g., POST remains POST). The preferred modern permanent redirect code.',
    rfc: 'RFC 9110, §15.4.9',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.4.9',
    cacheable: true,
    cacheableNote: 'Cacheable by default.',
    commonCauses: [
      'Modern HTTP to HTTPS redirection preserving API POST requests.',
      'Permanent API route renaming without breaking REST mutations.'
    ],
    howToFix: 'Update clients and links to target the new Location URL.',
    headers: [
      { header: 'Location', description: 'Permanent destination URI.', example: 'https://api.example.com/v2/items' }
    ],
    exampleResponse: {
      status: 308,
      statusText: 'Permanent Redirect',
      headers: {
        'Location': 'https://api.example.com/v2/charges'
      },
      body: null
    }
  },

  // ================= 4xx Client Error =================
  {
    code: 400,
    name: 'Bad Request',
    category: '4xx',
    categoryName: 'Client Error',
    summary: 'Server cannot process request due to client error (e.g. malformed syntax).',
    description: 'The server cannot or will not process the request due to something that is perceived to be a client error (e.g., malformed request syntax, invalid request message framing, or deceptive request routing).',
    rfc: 'RFC 9110, §15.5.1',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.1',
    cacheable: false,
    cacheableNote: 'Error responses are generally not cached.',
    commonCauses: [
      'Invalid JSON syntax (missing quotes, trailing commas).',
      'Missing required query parameters or body fields.',
      'Type mismatch in request payload.'
    ],
    howToFix: 'Inspect the response body for field error details and fix request payload syntax.',
    headers: [
      { header: 'Content-Type', description: 'RFC 7807 problem details or JSON error.', example: 'application/problem+json' }
    ],
    exampleResponse: {
      status: 400,
      statusText: 'Bad Request',
      headers: { 'Content-Type': 'application/problem+json' },
      body: {
        type: 'https://example.com/errors/bad-request',
        title: 'Malformed Request Payload',
        status: 400,
        detail: 'JSON parse error at line 4, column 12: Unexpected token',
        invalidParams: ['email', 'age']
      }
    }
  },
  {
    code: 401,
    name: 'Unauthorized',
    category: '4xx',
    categoryName: 'Client Error',
    summary: 'Request lacks valid authentication credentials.',
    description: 'Indicates that the request has not been applied because it lacks valid authentication credentials for the target resource. Although the name is "Unauthorized", the actual requirement is authentication (who you are), not authorization (what you can do).',
    rfc: 'RFC 9110, §15.5.2',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.2',
    cacheable: false,
    cacheableNote: 'Must not be cached.',
    commonCauses: [
      'Missing or malformed Authorization header (e.g. missing "Bearer " prefix).',
      'Expired, invalid, or revoked JWT / API key.',
      'Invalid basic auth username or password.'
    ],
    howToFix: 'Include a valid API key or Bearer token in the Authorization header. Refresh expired tokens.',
    headers: [
      { header: 'WWW-Authenticate', description: 'Mandatory challenge header specifying authentication scheme.', example: 'Bearer realm="api", error="invalid_token"' }
    ],
    exampleResponse: {
      status: 401,
      statusText: 'Unauthorized',
      headers: {
        'WWW-Authenticate': 'Bearer error="invalid_token", error_description="The access token expired"',
        'Content-Type': 'application/json'
      },
      body: {
        error: 'unauthorized',
        message: 'Authentication token has expired. Please refresh your session.',
        code: 'TOKEN_EXPIRED'
      }
    }
  },
  {
    code: 402,
    name: 'Payment Required',
    category: '4xx',
    categoryName: 'Client Error',
    summary: 'Reserved for digital payment schemes; used by SaaS for unpaid quotas/billing.',
    description: 'Originally created to enable digital cash and micro-payments. In modern web APIs, it is widely utilized for subscription paywalls, overdue customer bills, or exhausted monthly API billing quotas.',
    rfc: 'RFC 9110, §15.5.3',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.3',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: [
      'Account API credit balance reached zero.',
      'Subscription trial period expired.',
      'Payment card declined.'
    ],
    howToFix: 'Prompt the user to update their billing payment method or upgrade their account tier.',
    headers: [],
    exampleResponse: {
      status: 402,
      statusText: 'Payment Required',
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'payment_required',
        message: 'Monthly API usage limit reached. Upgrade your billing tier to proceed.',
        upgradeUrl: 'https://app.example.com/billing'
      }
    }
  },
  {
    code: 403,
    name: 'Forbidden',
    category: '4xx',
    categoryName: 'Client Error',
    summary: 'Server understands request and identity, but refuses authorization.',
    description: 'The server understood the request, client authentication is verified, but the server refuses to authorize it. Unlike 401, re-authenticating with the same credentials will make no difference.',
    rfc: 'RFC 9110, §15.5.4',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.4',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: [
      'User lacks required RBAC role or permission (e.g. regular user accessing admin endpoint).',
      'IP address blocked or geo-restricted.',
      'Resource belongs to a different tenant / organization.'
    ],
    howToFix: 'Request elevated permissions or verify role scopes in the user token.',
    headers: [],
    exampleResponse: {
      status: 403,
      statusText: 'Forbidden',
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'forbidden',
        message: 'You do not have permission to delete this project.',
        requiredScope: 'projects:delete',
        userRole: 'viewer'
      }
    }
  },
  {
    code: 404,
    name: 'Not Found',
    category: '4xx',
    categoryName: 'Client Error',
    summary: 'The origin server did not find a current representation for the target resource.',
    description: 'The origin server did not find a current representation for the target resource or is not willing to disclose that one exists. The most famous HTTP status code on the web.',
    rfc: 'RFC 9110, §15.5.5',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.5',
    cacheable: true,
    cacheableNote: 'Cacheable by default unless prevented by Cache-Control.',
    commonCauses: [
      'Typo in the URL path or slug.',
      'Resource was deleted from database.',
      'API route does not exist or wrong API version prefix.'
    ],
    howToFix: 'Check URL path spelling, verify route exists, or handle missing resource gracefully.',
    headers: [],
    exampleResponse: {
      status: 404,
      statusText: 'Not Found',
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'not_found',
        message: 'User with ID usr_99419 does not exist.',
        path: '/api/v1/users/usr_99419'
      }
    }
  },
  {
    code: 405,
    name: 'Method Not Allowed',
    category: '4xx',
    categoryName: 'Client Error',
    summary: 'HTTP method used is not supported for the requested resource.',
    description: 'The request method is known by the server but is not supported by the target resource. The server MUST generate an Allow header field in a 405 response containing a list of the target resource\'s currently supported methods.',
    rfc: 'RFC 9110, §15.5.6',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.6',
    cacheable: true,
    cacheableNote: 'Cacheable by default.',
    commonCauses: [
      'Sending POST to a read-only GET endpoint.',
      'Sending DELETE to an immutable resource collection.'
    ],
    howToFix: 'Check the Allow header for permitted methods (e.g. GET, HEAD, OPTIONS) and update request method.',
    headers: [
      { header: 'Allow', description: 'Mandatory list of permitted HTTP methods.', example: 'GET, POST, HEAD, OPTIONS' }
    ],
    exampleResponse: {
      status: 405,
      statusText: 'Method Not Allowed',
      headers: {
        'Allow': 'GET, HEAD, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: {
        error: 'method_not_allowed',
        message: 'DELETE method is not allowed on endpoint /api/v1/reports'
      }
    }
  },
  {
    code: 406,
    name: 'Not Acceptable',
    category: '4xx',
    categoryName: 'Client Error',
    summary: 'Target resource cannot generate content matching client Accept headers.',
    description: 'The target resource does not have a current representation that would be acceptable to the user agent, according to the proactive negotiation header fields (Accept, Accept-Charset, Accept-Encoding, Accept-Language).',
    rfc: 'RFC 9110, §15.5.7',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.7',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: [
      'Client sent "Accept: application/xml" to an API that only produces JSON.'
    ],
    howToFix: 'Update Accept header to request supported content types (e.g. */* or application/json).',
    headers: [],
    exampleResponse: {
      status: 406,
      statusText: 'Not Acceptable',
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'not_acceptable',
        message: 'Supported representations: application/json'
      }
    }
  },
  {
    code: 408,
    name: 'Request Timeout',
    category: '4xx',
    categoryName: 'Client Error',
    summary: 'Server closed network connection because client was idle too long.',
    description: 'The server did not receive a complete request message within the time that it was prepared to wait. A server should send the "close" connection option in the response.',
    rfc: 'RFC 9110, §15.5.9',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.9',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: [
      'Slow client upload on poor network connection.',
      'Keep-alive connection idle past server timeout threshold.'
    ],
    howToFix: 'Retry request with a stable network connection or optimize upload chunk sizes.',
    headers: [
      { header: 'Connection', description: 'Connection tear down flag.', example: 'close' }
    ],
    exampleResponse: {
      status: 408,
      statusText: 'Request Timeout',
      headers: { 'Connection': 'close' },
      body: { error: 'request_timeout', message: 'Client took too long to send request payload.' }
    }
  },
  {
    code: 409,
    name: 'Conflict',
    category: '4xx',
    categoryName: 'Client Error',
    summary: 'Request could not be processed due to a conflict with current resource state.',
    description: 'The request could not be completed due to a conflict with the current state of the target resource. Most likely to occur in response to a PUT or POST request (e.g., version control edit conflicts, unique key constraints).',
    rfc: 'RFC 9110, §15.5.10',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.10',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: [
      'Attempting to register with an email that is already taken.',
      'Optimistic locking failure (concurrent update with stale version).',
      'Git merge conflicts in API operations.'
    ],
    howToFix: 'Fetch latest resource state, resolve the conflict (e.g. pick a different unique username), and retry.',
    headers: [],
    exampleResponse: {
      status: 409,
      statusText: 'Conflict',
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'resource_conflict',
        message: 'A user with email "ada@example.com" already exists.',
        conflictingField: 'email'
      }
    }
  },
  {
    code: 410,
    name: 'Gone',
    category: '4xx',
    categoryName: 'Client Error',
    summary: 'Target resource has been permanently deleted with no forwarding address.',
    description: 'The target resource is no longer available at the origin server and this condition is likely to be permanent. Search engines will purge the URI from their indexes much faster than with a 404.',
    rfc: 'RFC 9110, §15.5.11',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.11',
    cacheable: true,
    cacheableNote: 'Cacheable by default.',
    commonCauses: [
      'Permanently decommissioned API endpoints or deleted accounts.',
      'Intentional removal of deprecated content.'
    ],
    howToFix: 'Remove all references and automated cron jobs calling this obsolete URI.',
    headers: [],
    exampleResponse: {
      status: 410,
      statusText: 'Gone',
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'resource_gone',
        message: 'The requested v0 legacy API was decommissioned on January 1, 2026.'
      }
    }
  },
  {
    code: 411,
    name: 'Length Required',
    category: '4xx',
    categoryName: 'Client Error',
    summary: 'Server refuses request without a defined Content-Length header.',
    description: 'The server refuses to accept the request without a defined Content-Length. The client may repeat the request if it adds a valid Content-Length header field.',
    rfc: 'RFC 9110, §15.5.12',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.12',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: ['Streaming chunked data to an endpoint requiring fixed-size payload headers.'],
    howToFix: 'Calculate byte size and provide Content-Length: [bytes] in request headers.',
    headers: [],
    exampleResponse: {
      status: 411,
      statusText: 'Length Required',
      headers: {},
      body: null
    }
  },
  {
    code: 412,
    name: 'Precondition Failed',
    category: '4xx',
    categoryName: 'Client Error',
    summary: 'Precondition given in request headers evaluated to false on server.',
    description: 'One or more conditions given in the request header fields (such as If-Match, If-Unmodified-Since) evaluated to false when tested on the server. Used to prevent the lost update problem.',
    rfc: 'RFC 9110, §15.5.13',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.13',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: [
      'If-Match ETag did not match current server resource ETag (concurrent edit detected).'
    ],
    howToFix: 'Fetch the latest resource representation, retrieve the new ETag, and retry.',
    headers: [],
    exampleResponse: {
      status: 412,
      statusText: 'Precondition Failed',
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'precondition_failed',
        message: 'Resource ETag has changed. Reload and re-apply changes.'
      }
    }
  },
  {
    code: 413,
    name: 'Payload Too Large',
    category: '4xx',
    categoryName: 'Client Error',
    summary: 'Request entity payload is larger than the server is willing or able to process.',
    description: 'The server is refusing to process a request because the request payload is larger than the server is willing or able to process. Previously known as "Request Entity Too Large".',
    rfc: 'RFC 9110, §15.5.14',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.14',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: [
      'Uploading a file exceeding Nginx `client_max_body_size` or express `limit: 50mb`.',
      'Large multi-megabyte JSON upload.'
    ],
    howToFix: 'Compress the payload, upload via multipart chunks, or increase server max body size limit.',
    headers: [
      { header: 'Retry-After', description: 'When the condition is temporary, specifies cooldown period.', example: '120' }
    ],
    exampleResponse: {
      status: 413,
      statusText: 'Payload Too Large',
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'payload_too_large',
        message: 'File size exceeds maximum allowable limit of 25MB.',
        maxSizeBytes: 26214400
      }
    }
  },
  {
    code: 414,
    name: 'URI Too Long',
    category: '4xx',
    categoryName: 'Client Error',
    summary: 'Request target URI is longer than the server is willing to interpret.',
    description: 'The server is refusing to service the request because the request-target is longer than the server is willing to interpret. Rare, usually occurs when client improperly uses GET with massive query strings instead of POST.',
    rfc: 'RFC 9110, §15.5.15',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.15',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: [
      'Accidentally appending large data arrays to GET query params instead of POST body.',
      'Redirection loops appending parameters repeatedly.'
    ],
    howToFix: 'Switch request method to POST and place data in the request body.',
    headers: [],
    exampleResponse: {
      status: 414,
      statusText: 'URI Too Long',
      headers: {},
      body: null
    }
  },
  {
    code: 415,
    name: 'Unsupported Media Type',
    category: '4xx',
    categoryName: 'Client Error',
    summary: 'Payload format/Content-Type is not supported by the endpoint.',
    description: 'The origin server is refusing to service the request because the payload is in a format not supported by this method on the target resource (e.g. sending text/xml to an API expecting application/json).',
    rfc: 'RFC 9110, §15.5.16',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.16',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: [
      'Missing or incorrect Content-Type request header.',
      'Uploading an unsupported file format (e.g. BMP instead of PNG/JPEG).'
    ],
    howToFix: 'Set "Content-Type: application/json" in your request headers and encode body accordingly.',
    headers: [
      { header: 'Accept', description: 'Server may advertise acceptable media types.', example: 'application/json' }
    ],
    exampleResponse: {
      status: 415,
      statusText: 'Unsupported Media Type',
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'unsupported_media_type',
        message: 'Endpoint expects "application/json", received "text/plain".'
      }
    }
  },
  {
    code: 416,
    name: 'Range Not Satisfiable',
    category: '4xx',
    categoryName: 'Client Error',
    summary: 'The byte range specified in the Range header cannot be satisfied.',
    description: 'None of the ranges in the request\'s Range header field overlap the current extent of the selected resource or the set of ranges was rejected due to invalid ranges.',
    rfc: 'RFC 9110, §15.5.17',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.17',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: ['Client requested bytes beyond the end of the file (e.g. bytes 5000-6000 of a 4000 byte file).'],
    howToFix: 'Check total file size using HEAD and adjust requested Range bounds.',
    headers: [
      { header: 'Content-Range', description: 'Returns actual size with unsatisfied specifier.', example: 'bytes */4096' }
    ],
    exampleResponse: {
      status: 416,
      statusText: 'Range Not Satisfiable',
      headers: { 'Content-Range': 'bytes */10240' },
      body: null
    }
  },
  {
    code: 418,
    name: "I'm a teapot",
    category: '4xx',
    categoryName: 'Client Error',
    summary: 'HTCPCP server refuses to brew coffee because it is permanently a teapot.',
    description: 'Specified in RFC 2324 (Hyper Text Coffee Pot Control Protocol) as an April Fools\' joke in 1998, codified in RFC 7168, and maintained across major HTTP libraries as an Easter egg standard.',
    rfc: 'RFC 2324 / RFC 7168',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc2324',
    cacheable: false,
    cacheableNote: 'Tea cannot be cached as coffee.',
    commonCauses: ['Attempting to brew coffee with an automated teapot device.'],
    howToFix: 'Request tea instead of coffee, or switch to a compatible French press.',
    headers: [],
    exampleResponse: {
      status: 418,
      statusText: "I'm a teapot",
      headers: { 'Content-Type': 'text/plain' },
      body: 'Short and stout. Here is my handle, here is my spout.'
    }
  },
  {
    code: 422,
    name: 'Unprocessable Content',
    category: '4xx',
    categoryName: 'Client Error',
    summary: 'Request syntax is valid, but semantic validation errors prevent execution.',
    description: 'The server understands the content type and the syntax of the request entity is correct, but was unable to process the contained instructions (e.g., semantic validation errors, missing business logic constraints). Formerly "Unprocessable Entity".',
    rfc: 'RFC 9110, §15.5.21',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.21',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: [
      'Form validation failures (e.g. password too short, invalid date format).',
      'Business rule violation (e.g. transfer amount exceeds available bank balance).'
    ],
    howToFix: 'Review field errors returned in response and update request values to satisfy business rules.',
    headers: [
      { header: 'Content-Type', description: 'Problem details schema.', example: 'application/problem+json' }
    ],
    exampleResponse: {
      status: 422,
      statusText: 'Unprocessable Content',
      headers: { 'Content-Type': 'application/problem+json' },
      body: {
        type: 'https://example.com/errors/validation-failed',
        title: 'Validation Error',
        status: 422,
        errors: [
          { field: 'password', message: 'Must be at least 8 characters long.' },
          { field: 'startDate', message: 'Start date cannot be in the past.' }
        ]
      }
    }
  },
  {
    code: 429,
    name: 'Too Many Requests',
    category: '4xx',
    categoryName: 'Client Error',
    summary: 'The client has sent too many requests in a given amount of time (rate limit).',
    description: 'The user has sent too many requests in a given amount of time ("rate limiting"). The response representations SHOULD explain the condition, and MAY include a Retry-After header indicating how long to wait before making a new request.',
    rfc: 'RFC 6585, §4',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc6585#section-4',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: [
      'Exceeded API rate limits (e.g. 100 requests per minute).',
      'Rapid bursts of API calls without exponential backoff.'
    ],
    howToFix: 'Implement client-side exponential backoff and jitter; inspect Retry-After and rate limit headers.',
    headers: [
      { header: 'Retry-After', description: 'Number of seconds to wait before retrying.', example: '30' },
      { header: 'X-RateLimit-Limit', description: 'Maximum permitted requests in time window.', example: '100' },
      { header: 'X-RateLimit-Remaining', description: 'Number of remaining allowed requests.', example: '0' },
      { header: 'X-RateLimit-Reset', description: 'Unix timestamp when limit window resets.', example: '1793364000' }
    ],
    exampleResponse: {
      status: 429,
      statusText: 'Too Many Requests',
      headers: {
        'Retry-After': '30',
        'X-RateLimit-Limit': '60',
        'X-RateLimit-Remaining': '0',
        'Content-Type': 'application/json'
      },
      body: {
        error: 'rate_limit_exceeded',
        message: 'Rate limit exceeded. Please wait 30 seconds before retrying.',
        retryAfterSeconds: 30
      }
    }
  },
  {
    code: 431,
    name: 'Request Header Fields Too Large',
    category: '4xx',
    categoryName: 'Client Error',
    summary: 'Server refuses request because individual headers or total header size is too large.',
    description: 'The server is unwilling to process the request because its header fields are too large. The request MAY be resubmitted after reducing the size of the request header fields (often caused by bloated cookie jars).',
    rfc: 'RFC 6585, §5',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc6585#section-5',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: [
      'Huge Cookie header containing dozens of tracking or legacy session cookies.',
      'Bloated custom authentication tokens in headers.'
    ],
    howToFix: 'Clear browser cookies for the domain or reduce header payload sizes.',
    headers: [],
    exampleResponse: {
      status: 431,
      statusText: 'Request Header Fields Too Large',
      headers: {},
      body: null
    }
  },
  {
    code: 451,
    name: 'Unavailable For Legal Reasons',
    category: '4xx',
    categoryName: 'Client Error',
    summary: 'Resource access is blocked as a consequence of legal demands or censorship.',
    description: 'The server is denying access to the resource as a consequence of a legal demand (e.g., DMCA copyright takedown, court order, national censorship). Named as a reference to Ray Bradbury\'s dystopian novel Fahrenheit 451.',
    rfc: 'RFC 7725',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc7725',
    cacheable: true,
    cacheableNote: 'Cacheable by default.',
    commonCauses: [
      'DMCA or copyright infringement takedown notices.',
      'Court injunction or regulatory geo-blocking.'
    ],
    howToFix: 'Consult legal counsel or appeal the takedown notice with the hosting provider.',
    headers: [
      { header: 'Link', description: 'Reference to the legal order or demand.', example: '<https://court.gov/orders/912>; rel="blocked-by"' }
    ],
    exampleResponse: {
      status: 451,
      statusText: 'Unavailable For Legal Reasons',
      headers: {
        'Link': '<https://spdx.org/licenses/takedown>; rel="blocked-by"',
        'Content-Type': 'application/json'
      },
      body: {
        error: 'legal_restriction',
        message: 'This resource is unavailable in your jurisdiction pursuant to court order.'
      }
    }
  },

  // ================= 5xx Server Error =================
  {
    code: 500,
    name: 'Internal Server Error',
    category: '5xx',
    categoryName: 'Server Error',
    summary: 'Server encountered an unexpected condition that prevented it from fulfilling request.',
    description: 'A generic error message, given when an unexpected condition was encountered and no more specific message is suitable. Represents an unhandled exception or crash inside server application code.',
    rfc: 'RFC 9110, §15.6.1',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.6.1',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: [
      'Unhandled runtime exception (NullPointerException, undefined is not a function).',
      'Database query crash or connection pool timeout.',
      'Syntax error in backend script.'
    ],
    howToFix: 'Check backend server logs and error tracking tools (e.g. Sentry) for stack traces and fix uncaught exceptions.',
    headers: [],
    exampleResponse: {
      status: 500,
      statusText: 'Internal Server Error',
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'internal_server_error',
        message: 'An unexpected error occurred. Reference ID: err_882940',
        timestamp: '2026-10-30T13:30:00Z'
      }
    }
  },
  {
    code: 501,
    name: 'Not Implemented',
    category: '5xx',
    categoryName: 'Server Error',
    summary: 'Server does not support the functionality required to fulfill the request.',
    description: 'The server does not support the functionality required to fulfill the request. This is the appropriate response when the server does not recognize the request method and is not capable of supporting it for any resource.',
    rfc: 'RFC 9110, §15.6.2',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.6.2',
    cacheable: true,
    cacheableNote: 'Cacheable by default.',
    commonCauses: [
      'Sending unrecognized HTTP verbs (e.g. PURGE, TRACE, PROPFIND on a basic server).',
      'Stubbed API routes during active development.'
    ],
    howToFix: 'Use a recognized HTTP method or finish backend implementation of the feature.',
    headers: [],
    exampleResponse: {
      status: 501,
      statusText: 'Not Implemented',
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'not_implemented',
        message: 'The requested capability is currently under development.'
      }
    }
  },
  {
    code: 502,
    name: 'Bad Gateway',
    category: '5xx',
    categoryName: 'Server Error',
    summary: 'Proxy/gateway received an invalid response from upstream origin server.',
    description: 'The server, while acting as a gateway or proxy, received an invalid response from an inbound server it accessed while attempting to fulfill the request. Common in microservices and reverse proxies (Nginx, Envoy).',
    rfc: 'RFC 9110, §15.6.3',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.6.3',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: [
      'Upstream Node/Python application crashed or failed to start.',
      'Reverse proxy connecting to wrong port or domain socket.',
      'Upstream process killed due to Out-Of-Memory (OOM).'
    ],
    howToFix: 'Check backend application process status (systemctl, PM2, Docker, Kubernetes) and restart if crashed.',
    headers: [],
    exampleResponse: {
      status: 502,
      statusText: 'Bad Gateway',
      headers: { 'Content-Type': 'text/html' },
      body: '<html><body><h1>502 Bad Gateway</h1><p>The upstream server closed the connection prematurely.</p></body></html>'
    }
  },
  {
    code: 503,
    name: 'Service Unavailable',
    category: '5xx',
    categoryName: 'Server Error',
    summary: 'Server is currently unable to handle request due to temporary overload/maintenance.',
    description: 'The server is currently unable to handle the request due to a temporary overload or scheduled maintenance, which will likely be alleviated after some delay. The server MAY send a Retry-After header field to suggest an appropriate wait time.',
    rfc: 'RFC 9110, §15.6.4',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.6.4',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: [
      'Server undergoing scheduled maintenance or database migrations.',
      'Server CPU/Memory exhausted under high traffic spike.'
    ],
    howToFix: 'Scale server capacity, deploy replicas, or wait for scheduled maintenance window to complete.',
    headers: [
      { header: 'Retry-After', description: 'Suggested seconds or HTTP date to wait before retrying.', example: '300' }
    ],
    exampleResponse: {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Retry-After': '120',
        'Content-Type': 'application/json'
      },
      body: {
        error: 'service_unavailable',
        message: 'System is currently undergoing routine maintenance. Please retry in 2 minutes.'
      }
    }
  },
  {
    code: 504,
    name: 'Gateway Timeout',
    category: '5xx',
    categoryName: 'Server Error',
    summary: 'Gateway/proxy did not receive timely response from upstream server.',
    description: 'The server, while acting as a gateway or proxy, did not receive a timely response from an upstream server it needed to access in order to complete the request.',
    rfc: 'RFC 9110, §15.6.5',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.6.5',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: [
      'Upstream database query taking longer than proxy timeout (e.g. 60s proxy_read_timeout).',
      'Third-party external API hanging indefinitely.',
      'Heavy computation freezing the single-threaded Node.js event loop.'
    ],
    howToFix: 'Optimize slow SQL queries, offload long computations to async background queues, or increase proxy timeouts.',
    headers: [],
    exampleResponse: {
      status: 504,
      statusText: 'Gateway Timeout',
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'gateway_timeout',
        message: 'The upstream server failed to respond within the 30-second timeout window.'
      }
    }
  },
  {
    code: 505,
    name: 'HTTP Version Not Supported',
    category: '5xx',
    categoryName: 'Server Error',
    summary: 'Server does not support the major HTTP protocol version used in request.',
    description: 'The server does not support, or refuses to support, the major version of HTTP that was used in the request message.',
    rfc: 'RFC 9110, §15.6.6',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.6.6',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: ['Attempting HTTP/3 or HTTP/2 cleartext on legacy server supporting only HTTP/1.1.'],
    howToFix: 'Ensure client connects with standard HTTP/1.1 or modern ALPN TLS negotiation.',
    headers: [],
    exampleResponse: {
      status: 505,
      statusText: 'HTTP Version Not Supported',
      headers: {},
      body: null
    }
  },
  {
    code: 507,
    name: 'Insufficient Storage',
    category: '5xx',
    categoryName: 'Server Error',
    summary: 'Server is unable to store the representation needed to complete the request.',
    description: 'A WebDAV status code indicating the method could not be performed on the resource because the server is unable to store the representation needed to successfully complete the request (disk full).',
    rfc: 'RFC 4918 (WebDAV), §11.5',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc4918#section-11.5',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: ['Server disk drive partition reached 100% capacity.'],
    howToFix: 'Free up disk space on the server filesystem or attach additional block storage.',
    headers: [],
    exampleResponse: {
      status: 507,
      statusText: 'Insufficient Storage',
      headers: {},
      body: null
    }
  },
  {
    code: 508,
    name: 'Loop Detected',
    category: '5xx',
    categoryName: 'Server Error',
    summary: 'Server detected an infinite loop while processing a WebDAV request.',
    description: 'The server terminated an operation because it encountered an infinite loop while processing a request with "Depth: infinity".',
    rfc: 'RFC 5842, §7.2',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc5842#section-7.2',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: ['Cyclic symlinks or recursive parent-child folder structures.'],
    howToFix: 'Break circular references in folder hierarchies.',
    headers: [],
    exampleResponse: {
      status: 508,
      statusText: 'Loop Detected',
      headers: {},
      body: null
    }
  },
  {
    code: 511,
    name: 'Network Authentication Required',
    category: '5xx',
    categoryName: 'Server Error',
    summary: 'Client must authenticate with the network before gaining access.',
    description: 'The client needs to authenticate to gain network access. Intended for intercepting captive portals (e.g., airport Wi-Fi login screens) before granting general internet access.',
    rfc: 'RFC 6585, §6',
    rfcUrl: 'https://datatracker.ietf.org/doc/html/rfc6585#section-6',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: ['Connecting to public hotel/airport Wi-Fi requiring portal agreement.'],
    howToFix: 'Open browser navigation to portal landing page and accept terms or enter credentials.',
    headers: [
      { header: 'Location', description: 'Redirect URL to captive portal login.', example: 'https://wifi-login.local' }
    ],
    exampleResponse: {
      status: 511,
      statusText: 'Network Authentication Required',
      headers: { 'Location': 'https://portal.airport-wifi.net/login' },
      body: null
    }
  },

  // ================= Unofficial & Edge / Cloudflare / Nginx =================
  {
    code: 499,
    name: 'Client Closed Request',
    category: 'unofficial',
    categoryName: 'Unofficial / Nginx',
    summary: 'Nginx status when client closed connection while server was still processing.',
    description: 'An Nginx-specific extension code logged when a client (browser or caller) drops or closes the HTTP connection before the server finishes sending the response.',
    rfc: 'Nginx Extension',
    rfcUrl: 'https://en.wikipedia.org/wiki/List_of_HTTP_status_codes#nginx',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: [
      'User navigated away or refreshed browser while waiting for a slow page.',
      'Frontend fetch timeout triggered abortController.abort().'
    ],
    howToFix: 'Optimize slow backend response times or lengthen frontend fetch timeout thresholds.',
    headers: [],
    exampleResponse: {
      status: 499,
      statusText: 'Client Closed Request',
      headers: {},
      body: null
    }
  },
  {
    code: 520,
    name: 'Web Server Returned an Unknown Error',
    category: 'unofficial',
    categoryName: 'Unofficial / Cloudflare',
    summary: 'Cloudflare catch-all error when origin server returns something unexpected.',
    description: 'Cloudflare returned this code because the origin web server returned an empty, unknown, or inexplicable response to Cloudflare proxy.',
    rfc: 'Cloudflare Extension',
    rfcUrl: 'https://developers.cloudflare.com/support/troubleshooting/cloudflare-errors/troubleshooting-cloudflare-5xx-errors/#error-520',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: ['Origin server crashed mid-response, sent invalid HTTP headers, or closed TCP connection violently.'],
    howToFix: 'Check origin Apache/Nginx error logs and ensure origin headers are standard.',
    headers: [],
    exampleResponse: {
      status: 520,
      statusText: 'Web Server Returned an Unknown Error',
      headers: { 'Server': 'cloudflare' },
      body: 'Cloudflare: Origin web server returned an empty or invalid response.'
    }
  },
  {
    code: 521,
    name: 'Web Server Is Down',
    category: 'unofficial',
    categoryName: 'Unofficial / Cloudflare',
    summary: 'Cloudflare could not establish a TCP connection to the origin server.',
    description: 'Cloudflare successfully routed to your origin server, but the origin server refused the TCP connection on port 80/443 (Connection Refused).',
    rfc: 'Cloudflare Extension',
    rfcUrl: 'https://developers.cloudflare.com/support/troubleshooting/cloudflare-errors/troubleshooting-cloudflare-5xx-errors/#error-521',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: ['Web server software (Nginx/Apache/Node) is stopped or firewall is blocking Cloudflare IP ranges.'],
    howToFix: 'Verify web server process is running and allowlist Cloudflare IP ranges in firewall / iptables.',
    headers: [],
    exampleResponse: {
      status: 521,
      statusText: 'Web Server Is Down',
      headers: { 'Server': 'cloudflare' },
      body: 'Cloudflare: Web server is down.'
    }
  },
  {
    code: 522,
    name: 'Connection Timed Out',
    category: 'unofficial',
    categoryName: 'Unofficial / Cloudflare',
    summary: 'Cloudflare could not negotiate a TCP handshake with the origin server.',
    description: 'Cloudflare was able to contact the origin server IP, but could not establish a TCP handshake before the timeout expired.',
    rfc: 'Cloudflare Extension',
    rfcUrl: 'https://developers.cloudflare.com/support/troubleshooting/cloudflare-errors/troubleshooting-cloudflare-5xx-errors/#error-522',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: ['Origin server firewall dropping packets, network routing issue, or origin overloaded.'],
    howToFix: 'Check server load, verify routing, and ensure Cloudflare IPs are not rate-limited by fail2ban.',
    headers: [],
    exampleResponse: {
      status: 522,
      statusText: 'Connection Timed Out',
      headers: { 'Server': 'cloudflare' },
      body: 'Cloudflare: Connection timed out to origin.'
    }
  },
  {
    code: 524,
    name: 'A Timeout Occurred',
    category: 'unofficial',
    categoryName: 'Unofficial / Cloudflare',
    summary: 'Cloudflare completed TCP handshake, but origin did not send HTTP response in 100s.',
    description: 'Cloudflare was able to successfully connect to the origin, but the origin server took longer than 100 seconds to generate and send an HTTP response.',
    rfc: 'Cloudflare Extension',
    rfcUrl: 'https://developers.cloudflare.com/support/troubleshooting/cloudflare-errors/troubleshooting-cloudflare-5xx-errors/#error-524',
    cacheable: false,
    cacheableNote: 'Not cacheable.',
    commonCauses: ['Long-running database query, file conversion, or batch process executed synchronously.'],
    howToFix: 'Move long tasks to asynchronous background workers or poll for status.',
    headers: [],
    exampleResponse: {
      status: 524,
      statusText: 'A Timeout Occurred',
      headers: { 'Server': 'cloudflare' },
      body: 'Cloudflare: Origin did not respond within 100 seconds.'
    }
  }
];

/**
 * Returns color tokens for a given status category or code number.
 */
export function getStatusColor(codeOrCategory) {
  let cat = typeof codeOrCategory === 'string' ? codeOrCategory : null;
  if (!cat && typeof codeOrCategory === 'number') {
    if (codeOrCategory >= 100 && codeOrCategory < 200) cat = '1xx';
    else if (codeOrCategory >= 200 && codeOrCategory < 300) cat = '2xx';
    else if (codeOrCategory >= 300 && codeOrCategory < 400) cat = '3xx';
    else if (codeOrCategory >= 400 && codeOrCategory < 500) cat = '4xx';
    else if (codeOrCategory >= 500 && codeOrCategory < 600) cat = '5xx';
    else cat = 'unofficial';
  }

  switch (cat) {
    case '1xx':
      return {
        bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
        ring: 'ring-blue-500',
        accent: '#3b82f6',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-500'
      };
    case '2xx':
      return {
        bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
        ring: 'ring-emerald-500',
        accent: '#10b981',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500'
      };
    case '3xx':
      return {
        bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
        ring: 'ring-amber-500',
        accent: '#f59e0b',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500'
      };
    case '4xx':
      return {
        bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50',
        badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
        ring: 'ring-rose-500',
        accent: '#f43f5e',
        text: 'text-rose-600 dark:text-rose-400',
        border: 'border-rose-500'
      };
    case '5xx':
      return {
        bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/50',
        badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
        ring: 'ring-purple-500',
        accent: '#a855f7',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-500'
      };
    case 'unofficial':
    default:
      return {
        bg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/50',
        badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300',
        ring: 'ring-cyan-500',
        accent: '#06b6d4',
        text: 'text-cyan-600 dark:text-cyan-400',
        border: 'border-cyan-500'
      };
  }
}

/**
 * Multi-language server code snippet generator for returning an HTTP status code.
 */
export function generateStatusCodeSnippet(code, language = 'javascript') {
  const codeNum = typeof code === 'number' ? code : parseInt(code, 10);
  const statusMeta = HTTP_STATUS_CODES.find(s => s.code === codeNum) || {
    code: codeNum,
    name: 'Custom Status',
    summary: 'Response code'
  };

  switch (language) {
    case 'python':
      return `# Python FastAPI / Starlette
from fastapi import FastAPI, Response, status
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/resource")
def get_resource():
    return JSONResponse(
        status_code=${statusMeta.code},
        content={"message": "${statusMeta.name}", "code": ${statusMeta.code}}
    )`;

    case 'go':
      return `// Go (net/http)
package main

import (
    "encoding/json"
    "net/http"
)

func handler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(${statusMeta.code}) // http.Status${statusMeta.name.replace(/[^a-zA-Z]/g, '')}
    json.NewEncoder(w).Encode(map[string]any{
        "status": ${statusMeta.code},
        "message": "${statusMeta.name}",
    })
}`;

    case 'csharp':
      return `// C# ASP.NET Core Controller
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class ResourceController : ControllerBase
{
    [HttpGet]
    public IActionResult GetResource()
    {
        return StatusCode(${statusMeta.code}, new {
            status = ${statusMeta.code},
            message = "${statusMeta.name}"
        });
    }
}`;

    case 'rust':
      return `// Rust (Axum web framework)
use axum::{
    http::StatusCode,
    response::{IntoResponse, Json},
    routing::get,
    Router,
};
use serde_json::json;

async fn handler() -> impl IntoResponse {
    (
        StatusCode::from_u16(${statusMeta.code}).unwrap(),
        Json(json!({
            "status": ${statusMeta.code},
            "message": "${statusMeta.name}"
        }))
    )
}`;

    case 'php':
      return `<?php
// PHP
http_response_code(${statusMeta.code});
header('Content-Type: application/json; charset=utf-8');

echo json_encode([
    'status' => ${statusMeta.code},
    'message' => '${statusMeta.name}'
]);
exit;`;

    case 'javascript':
    default:
      return `// Node.js Express
import express from 'express';
const app = express();

app.get('/api/resource', (req, res) => {
  res.status(${statusMeta.code}).json({
    status: ${statusMeta.code},
    message: '${statusMeta.name}'
  });
});`;
  }
}

/**
 * Interactive Decision Tree for choosing the right HTTP Status Code.
 */
export const DECISION_TREE = {
  id: 'root',
  question: 'What is the outcome of the client request?',
  options: [
    {
      label: 'Request Succeeded (2xx)',
      description: 'The request executed successfully without errors.',
      next: 'success_flow'
    },
    {
      label: 'Redirection Required (3xx)',
      description: 'The client must look elsewhere or use cached data.',
      next: 'redirect_flow'
    },
    {
      label: 'Client / Validation Error (4xx)',
      description: 'The client passed invalid input, bad auth, or invalid parameters.',
      next: 'client_flow'
    },
    {
      label: 'Server / Upstream Failure (5xx)',
      description: 'The server threw an exception or upstream proxy timed out.',
      next: 'server_flow'
    }
  ],
  nodes: {
    success_flow: {
      question: 'Did the operation create a new entity or return content?',
      options: [
        {
          label: 'Created a new resource (e.g. database row, order)',
          description: 'A new resource was instantiated and saved.',
          recommendation: 201,
          hint: 'Return 201 Created along with a Location header pointing to the new resource URL.'
        },
        {
          label: 'Succeeded with no response body payload (e.g. DELETE, simple update)',
          description: 'Action completed, no body payload needed.',
          recommendation: 204,
          hint: 'Return 204 No Content. Ensure response body is completely empty.'
        },
        {
          label: 'Accepted for async / background processing (not finished yet)',
          description: 'Queued in background worker; client can check status later.',
          recommendation: 202,
          hint: 'Return 202 Accepted with a Location header pointing to a job status URL.'
        },
        {
          label: 'Standard read / fetch with payload',
          description: 'Normal query returning requested representation.',
          recommendation: 200,
          hint: 'Return 200 OK with the representation payload in the body.'
        }
      ]
    },
    redirect_flow: {
      question: 'What kind of redirection is needed?',
      options: [
        {
          label: 'Permanent redirect (resource moved forever)',
          description: 'Should clients update their bookmarks and search engines update index?',
          next: 'permanent_redirect_flow'
        },
        {
          label: 'Temporary redirect (maintenance or dynamic routing)',
          description: 'Resource is temporarily elsewhere.',
          next: 'temporary_redirect_flow'
        },
        {
          label: 'Cached copy is still fresh (Conditional GET)',
          description: 'ETag or Last-Modified matches; avoid re-transmitting data.',
          recommendation: 304,
          hint: 'Return 304 Not Modified. Client will read directly from browser cache.'
        },
        {
          label: 'Redirect to GET after form submission (PRG pattern)',
          description: 'Prevent double form submission when user hits reload.',
          recommendation: 303,
          hint: 'Return 303 See Other pointing to the confirmation GET page.'
        }
      ]
    },
    permanent_redirect_flow: {
      question: 'Must the HTTP method (e.g. POST/PUT) be strictly preserved?',
      options: [
        {
          label: 'Yes, preserve HTTP method (POST remains POST)',
          description: 'Modern standard for REST APIs and mutation redirects.',
          recommendation: 308,
          hint: 'Use 308 Permanent Redirect. Clients MUST NOT change method to GET.'
        },
        {
          label: 'No / Traditional website redirect (POST may become GET)',
          description: 'Standard historical website URL change.',
          recommendation: 301,
          hint: 'Use 301 Moved Permanently for standard page migrations.'
        }
      ]
    },
    temporary_redirect_flow: {
      question: 'Must the HTTP method (e.g. POST/PUT) be strictly preserved?',
      options: [
        {
          label: 'Yes, preserve HTTP method (POST remains POST)',
          description: 'Prevent silent conversion of API payload into empty GET.',
          recommendation: 307,
          hint: 'Use 307 Temporary Redirect for API routing.'
        },
        {
          label: 'No / General browser redirect',
          description: 'Standard temporary redirection.',
          recommendation: 302,
          hint: 'Use 302 Found for general user-agent redirections.'
        }
      ]
    },
    client_flow: {
      question: 'What is the nature of the client error?',
      options: [
        {
          label: 'Authentication or Authorization problem',
          description: 'Missing credentials, expired token, or insufficient permissions.',
          next: 'auth_flow'
        },
        {
          label: 'Resource does not exist or was deleted',
          description: 'URL target is missing from the database.',
          next: 'missing_flow'
        },
        {
          label: 'Payload validation or bad syntax',
          description: 'Malformed JSON or semantic rule failures.',
          next: 'validation_flow'
        },
        {
          label: 'Too many requests / Rate limiting',
          description: 'Caller exceeded quota or request threshold.',
          recommendation: 429,
          hint: 'Return 429 Too Many Requests with a Retry-After header.'
        },
        {
          label: 'Conflict with current resource state (e.g. duplicate email, version lock)',
          description: 'Concurrent update or unique constraint violation.',
          recommendation: 409,
          hint: 'Return 409 Conflict with details on which field conflicted.'
        }
      ]
    },
    auth_flow: {
      question: 'Is the client unauthenticated or lacks permission?',
      options: [
        {
          label: 'Client provided no credentials or token is expired/invalid (Authentication)',
          description: 'Server does not know who the client is.',
          recommendation: 401,
          hint: 'Return 401 Unauthorized with a WWW-Authenticate challenge header.'
        },
        {
          label: 'Client identity is known, but lacks permission / role (Authorization)',
          description: 'Logged in as regular user, trying to access admin function.',
          recommendation: 403,
          hint: 'Return 403 Forbidden. Re-authenticating with same credentials will not help.'
        }
      ]
    },
    missing_flow: {
      question: 'Was the resource deleted permanently or simply not found?',
      options: [
        {
          label: 'Permanently deleted and should be removed from search engines',
          description: 'Resource is gone forever with no forwarding address.',
          recommendation: 410,
          hint: 'Return 410 Gone. Instructs bots to purge the index immediately.'
        },
        {
          label: 'Not found or not willing to disclose existence',
          description: 'Standard missing entity or invalid ID.',
          recommendation: 404,
          hint: 'Return 404 Not Found.'
        }
      ]
    },
    validation_flow: {
      question: 'Is the syntax malformed or are business rules violated?',
      options: [
        {
          label: 'Semantic business rule violation (e.g. age must be >= 18, valid JSON)',
          description: 'Syntax is valid JSON, but data validation failed.',
          recommendation: 422,
          hint: 'Return 422 Unprocessable Content (RFC 9110) with validation error array.'
        },
        {
          label: 'Malformed syntax or unparseable framing (e.g. invalid JSON)',
          description: 'Server cannot parse or read the message stream.',
          recommendation: 400,
          hint: 'Return 400 Bad Request.'
        },
        {
          label: 'Wrong Content-Type (e.g. sent XML instead of JSON)',
          description: 'Media type not acceptable to this endpoint.',
          recommendation: 415,
          hint: 'Return 415 Unsupported Media Type with supported types.'
        }
      ]
    },
    server_flow: {
      question: 'Where did the failure originate?',
      options: [
        {
          label: 'Uncaught exception or crash in your own application code',
          description: 'Unhandled runtime error or database query exception.',
          recommendation: 500,
          hint: 'Return 500 Internal Server Error and check server stack traces.'
        },
        {
          label: 'Reverse proxy / Gateway received bad response from upstream backend',
          description: 'Nginx, Envoy, or API Gateway could not reach backend service.',
          recommendation: 502,
          hint: 'Return 502 Bad Gateway. Verify your upstream application process is alive.'
        },
        {
          label: 'Upstream backend took too long to answer (Timeout)',
          description: 'Operation took longer than proxy read timeout.',
          recommendation: 504,
          hint: 'Return 504 Gateway Timeout. Optimize slow queries or use background jobs.'
        },
        {
          label: 'System is undergoing maintenance or temporarily overloaded',
          description: 'Expected to recover shortly; client should retry later.',
          recommendation: 503,
          hint: 'Return 503 Service Unavailable with a Retry-After header.'
        }
      ]
    }
  }
};

/**
 * Exports status codes in Markdown table format.
 */
export function exportAsMarkdown(codes = HTTP_STATUS_CODES) {
  let md = '# HTTP Status Code Reference\n\n';
  md += '| Code | Name | Category | RFC | Cacheable | Summary |\n';
  md += '| :--- | :--- | :--- | :--- | :---: | :--- |\n';
  for (const s of codes) {
    md += `| **${s.code}** | ${s.name} | ${s.categoryName} | ${s.rfc} | ${s.cacheable ? 'Yes' : 'No'} | ${s.summary.replace(/\|/g, '\\|')} |\n`;
  }
  return md;
}

/**
 * Exports status codes in CSV format.
 */
export function exportAsCsv(codes = HTTP_STATUS_CODES) {
  const headers = ['Code', 'Name', 'Category', 'RFC', 'Cacheable', 'Summary'];
  const rows = codes.map(s => [
    s.code,
    `"${s.name.replace(/"/g, '""')}"`,
    `"${s.categoryName}"`,
    `"${s.rfc}"`,
    s.cacheable ? 'Yes' : 'No',
    `"${s.summary.replace(/"/g, '""')}"`
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Exports status codes in JSON format.
 */
export function exportAsJson(codes = HTTP_STATUS_CODES) {
  return JSON.stringify(codes, null, 2);
}
