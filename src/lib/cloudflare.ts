export async function createDnsRecord(zoneId: string, name: string, content: string) {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`
        },
        body: JSON.stringify({
            name,
            ttl: 3600,
            type: "A",
            comment: "Domain verification record",
            content,
            private_routing: true,
            proxied: true
        })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create DNS record: ${JSON.stringify(errorData)}`);
    }
    return response.json();
}
