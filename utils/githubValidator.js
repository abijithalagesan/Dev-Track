const axios = require('axios');

const validateGithubRepo = async (url) => {
    // Basic regex to extract owner and repo from URL
    const regex = /github\.com\/([^\/]+)\/([^\/]+)/;
    const match = url.match(regex);
    
    if (!match) return { status: 'invalid', message: 'Not a valid GitHub URL' };

    const [, owner, repo] = match;
    const repoName = repo.replace('.git', '');

    try {
        // Fetch repo details
        const repoResponse = await axios.get(`https://api.github.com/repos/${owner}/${repoName}`, {
            headers: process.env.GITHUB_TOKEN ? { Authorization: `token ${process.env.GITHUB_TOKEN}` } : {}
        });

        // Check for commits
        const commitsResponse = await axios.get(`https://api.github.com/repos/${owner}/${repoName}/commits`, {
            headers: process.env.GITHUB_TOKEN ? { Authorization: `token ${process.env.GITHUB_TOKEN}` } : {},
            params: { per_page: 1 }
        });

        if (commitsResponse.data.length === 0) {
            return { status: 'empty', message: 'Repository has no commits' };
        }

        return {
            status: 'valid',
            repoDetails: {
                stars: repoResponse.data.stargazers_count,
                lastCommit: commitsResponse.data[0].commit.author.date,
                message: 'Repository is public and active.'
            }
        };

    } catch (error) {
        if (error.response && error.response.status === 404) {
             return { status: 'invalid', message: 'Repository not found or is private' };
        }
        return { status: 'invalid', message: 'GitHub API validation failed' };
    }
};

module.exports = validateGithubRepo;
