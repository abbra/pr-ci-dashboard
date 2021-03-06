export const DEFAULT_OWNER = "freeipa"
export const DEFAULT_REPO = "freeipa";
export const GITHUB_FETCH_LIMIT = 100;
const TOKEN_KEY = "github_token"
const rateLimit = {};

function getToken() {
    return window.localStorage.getItem(TOKEN_KEY);
}

function setToken(value) {
    window.localStorage.setItem(TOKEN_KEY, '');
}

export function isAuthenticated() {
    let token = getToken();
    return !!token;
}

export function logout() {
    setToken(null);
    return true;
}

export function createAuthTestQuery(owner, repo)
{
    let query = `
    query { repository(owner: "${owner}", name: "${repo}") {
        url
        name
    }
    rateLimit {
        limit
        cost
        remaining
        resetAt
        }
    }
    `
    return query;
}

export function gitHubQuery(query, token) {
    token = token || getToken();
    if (!token) {
        return Promise.reject(new Error('Not authenticated'))
    }

    const init_obj = {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            'Content-Type': "application/json"
        },
        mode: "cors",
        body: JSON.stringify({query: query})
    };

    const p = window.fetch('https://api.github.com/graphql', init_obj);
    return p;
}

export function gitHubJSONQuery(query, token) {
    return gitHubQuery(query, token)
    .then(response => response.json())
    .then(result => {
        let data = result.data;
        if (data.rateLimit) {
            Object.assign(rateLimit, data.rateLimit);
        }
        return data;
    });
}

export function authenticate(token, owner, repo) {
    owner = owner || DEFAULT_OWNER;
    repo = repo || DEFAULT_REPO;
    logout();
    const query = createAuthTestQuery(owner, repo);
    return new Promise ((resolve, reject) => {
        gitHubQuery(query, token).then(
            response => {
                if (response.ok) {
                    localStorage.setItem(TOKEN_KEY, token);
                    resolve(true);
                } else {
                    resolve(false);
                }
            }
        ).catch(error => reject(error));
    });
}
