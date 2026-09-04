(() => {
    const API_BASE_PATH = '/api';

    async function request(path, options = {}) {
        const headers = new Headers(options.headers || {});
        const hasBody = options.body !== undefined && options.body !== null;

        if (hasBody && !headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }

        const token = localStorage.getItem('authToken');
        if (token && !headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        const response = await fetch(`${API_BASE_PATH}${path}`, {
            ...options,
            headers,
        });
        const contentType = response.headers.get('content-type') || '';
        const result = contentType.includes('application/json')
            ? await response.json()
            : await response.text();

        if (!response.ok) {
            const message = typeof result === 'object' && result !== null
                ? result.message || result.error ||
                    (Array.isArray(result.errors) ? result.errors.join(', ') : result.errors)
                : result;
            const error = new Error(
                typeof message === 'string'
                    ? message
                    : message ? JSON.stringify(message) : 'Yêu cầu không thành công'
            );
            error.status = response.status;
            error.details = result;
            throw error;
        }

        return result;
    }

    window.api = {
        request,
        register(payload) {
            return request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        },
        login(payload) {
            return request('/auth/login', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        },
    };
})();