const axios = require('axios');

const validateLeetcodeUrl = async (url) => {
    // Basic regex to check if it's a LeetCode URL
    const regex = /leetcode\.com/;
    if (!regex.test(url)) {
        return { status: 'invalid', message: 'Not a valid LeetCode URL' };
    }

    try {
        // Attempt to fetch the URL to check if it exists (might be blocked by Cloudflare, but we can try)
        // Set a gentle user-agent
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            },
            timeout: 5000 // 5 seconds timeout
        });

        if (response.status === 200) {
            return {
                status: 'valid',
                details: {
                    message: 'LeetCode link is valid and accessible.'
                }
            };
        } else {
            return { status: 'invalid', message: `Received unexpected status code: ${response.status}` };
        }
    } catch (error) {
        // If Cloudflare blocks it (403), consider it valid because the URL still seems properly formed
        if (error.response && (error.response.status === 403 || error.response.status === 404)) {
            // Check if it's a 404 vs 403
            if (error.response.status === 404) {
                 return { status: 'invalid', message: 'LeetCode page not found' };
            } else {
                return {
                    status: 'valid',
                    details: {
                        message: 'LeetCode link is valid (verification restricted by Cloudflare).'
                    }
                };
            }
        }
        
        return { status: 'invalid', message: 'Failed to reach LeetCode URL' };
    }
};

module.exports = validateLeetcodeUrl;
