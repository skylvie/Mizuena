const img = document.getElementById('mizuena');
const imgLink = document.getElementById('imgLink');
const loading = document.querySelector('.loading');

// UUID system so people can easily get the source image
async function load() {
    try {
        const res = await fetch('/api/v1/mizuena');
        const data = await res.json();
        const uuid = data.uuid;
        const url = `/api/v1/mizuena?uuid=${uuid}`;

        img.src = url;
        imgLink.href = url;
    } catch (err) {
        console.error(err);
        loading.textContent = 'Failed to load image :(';
    }
}

img.addEventListener('load', () => {
    img.style.opacity = '1';
    loading.style.display = 'none';
});

img.addEventListener('error', () => {
    img.alt = 'Failed to load image :(';
    loading.textContent = 'Failed to load image :(';
});

load();
