// API Configuration
const API_BASE_URL = window.location.hostname.includes('replit.dev') 
    ? `${window.location.protocol}//${window.location.hostname.replace(':8080', ':3000')}/api`  // Replit environment
    : 'http://localhost:3000/api';  // Local development

console.log('Using API URL:', API_BASE_URL);

// Store all news stories globally
let allStories = [];
let activeCategory = null;

// Available categories with emojis
const categories = [
    { name: 'Alla', emoji: '📰' },
    { name: 'Politik', emoji: '🏛️' },
    { name: 'Världsnyheter', emoji: '🌍' },
    { name: 'Ekonomi & Näringsliv', emoji: '📈' },
    { name: 'Teknik', emoji: '💻' },
    { name: 'Hälsa', emoji: '🏥' },
    { name: 'Sport', emoji: '⚽' },
    { name: 'Underhållning', emoji: '🎬' },
    { name: 'Vetenskap', emoji: '🔬' },
    { name: 'Brott & Rätt', emoji: '⚖️' },
    { name: 'Miljö & Klimat', emoji: '🌱' },
    { name: 'Livsstil & Kultur', emoji: '🏡' }
];

// Create category buttons
function createCategoryButtons() {
    const categoryContainer = document.querySelector('.category-filters');
    if (!categoryContainer) return;

    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'category-button';
        button.setAttribute('data-category', category.name);
        button.innerHTML = `${category.emoji} ${category.name}`;
        
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            document.querySelectorAll('.category-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Update active category and filter news
            activeCategory = category.name === 'Alla' ? null : category.name;
            filterAndDisplayNews();
        });
        
        categoryContainer.appendChild(button);
    });
    
    // Set "Alla" as active by default
    categoryContainer.querySelector('[data-category="Alla"]').classList.add('active');
}

// Filter news by category
function filterAndDisplayNews() {
    const newsGrid = document.querySelector('.news-grid');
    newsGrid.innerHTML = '';  // Clear current news

    let filteredStories = allStories;
    if (activeCategory) {
        filteredStories = allStories.filter(story => 
            story.searchResults.categories.some(cat => 
                cat.startsWith(activeCategory)
            )
        );
    }

    // Create and append news cards for filtered stories
    filteredStories.forEach(story => {
        const card = createNewsCard(story);
        newsGrid.appendChild(card);
    });

    // Update the stories count in metadata
    updateMetadataCount(filteredStories.length);
}

// Update metadata count for filtered results
function updateMetadataCount(filteredCount) {
    const storiesInfo = document.querySelector('.stories-info');
    if (storiesInfo) {
        storiesInfo.textContent = `Visar ${filteredCount} av ${allStories.length} nyheter`;
    }
}

// Update current time in the header
function updateCurrentTime() {
    const timeElement = document.querySelector('.current-time');
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    };
    timeElement.textContent = now.toLocaleDateString('sv-SE', options);
}

// Format date string
function formatDate(dateString) {
    if (!dateString) return 'Nyligen';
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).replace(/\s+/g, ' ');  // Ensure consistent spacing
}

// Update metadata display
function updateMetadata(meta, lastUpdated) {
    const metadataElement = document.querySelector('.news-metadata');
    if (metadataElement) {
        metadataElement.innerHTML = `
            <div class="metadata-content">
                <span class="last-updated">Senast uppdaterad: ${formatDate(lastUpdated)}</span>
                <span class="api-version">API Version: ${meta.api_version}</span>
                <span class="stories-info">Visar ${meta.stories_processed} av ${meta.stories_requested} nyheter</span>
            </div>
        `;
    }
}

// Create HTML for a single news card
function createNewsCard(story) {
    const card = document.createElement('article');
    card.className = 'news-card';

    // Create the news content
    const content = document.createElement('div');
    content.className = 'news-content';

    // Add title
    const title = document.createElement('h2');
    title.className = 'title';
    title.textContent = story.searchResults?.title || story.originalStory?.title || 'Ingen rubrik tillgänglig';

    // Create preview text from first paragraph
    const previewText = document.createElement('div');
    previewText.className = 'preview-text';
    
    // Get the first paragraph of the main text
    const mainTextParagraphs = story.searchResults?.mainText?.split('\n\n') || [];
    if (mainTextParagraphs.length > 0) {
        previewText.textContent = mainTextParagraphs[0].trim();
    }

    // Add expand indicator
    const expandIndicator = document.createElement('div');
    expandIndicator.className = 'expand-indicator';
    expandIndicator.textContent = 'Läs mer';

    // Create full content container
    const fullContent = document.createElement('div');
    fullContent.className = 'full-content';

    // Add main text (excluding first paragraph)
    const mainText = document.createElement('div');
    mainText.className = 'main-text';
    if (story.searchResults?.mainText) {
        const paragraphs = mainTextParagraphs.slice(1); // Skip first paragraph
        mainText.innerHTML = paragraphs
            .filter(p => p.trim())
            .map(p => `<p>${p.trim()}</p>`)
            .join('\n\n'); // Add double line break between paragraphs
    }

    // Add latest update if available
    if (story.searchResults?.latestUpdate?.content) {
        const updateDate = formatDate(story.searchResults.latestUpdate.timestamp);
        const latestUpdate = document.createElement('div');
        latestUpdate.className = 'latest-update';
        latestUpdate.innerHTML = `
            <h3>Senaste uppdatering</h3>
            <p>${updateDate} - ${story.searchResults.latestUpdate.content}</p>
        `;
        fullContent.appendChild(latestUpdate);
    }

    // Add click handler for expanding/collapsing
    card.addEventListener('click', () => {
        const wasExpanded = card.classList.contains('expanded');
        // Close all other expanded cards
        document.querySelectorAll('.news-card.expanded').forEach(expandedCard => {
            if (expandedCard !== card) {
                expandedCard.classList.remove('expanded');
            }
        });
        // Toggle current card
        card.classList.toggle('expanded');
        // Update expand indicator text
        expandIndicator.textContent = wasExpanded ? 'Läs mer' : 'Visa mindre';
    });

    // Add processing metadata if there was an error
    if (story.metadata?.status === 'error') {
        content.innerHTML += `
            <div class="processing-error">
                <p>Det gick inte att bearbeta denna nyhet fullständigt.</p>
                <p class="error-details">Fel: ${story.metadata.error}</p>
            </div>
        `;
    }

    // Combine all elements
    content.appendChild(title);
    content.appendChild(previewText);
    content.appendChild(expandIndicator);
    
    // Add full content
    fullContent.appendChild(mainText);
    content.appendChild(fullContent);
    
    card.appendChild(content);

    return card;
}

// Fetch news from the API
async function fetchNews() {
    const loadingSpinner = document.querySelector('.loading-spinner');
    const newsGrid = document.querySelector('.news-grid');
    
    try {
        console.log('Fetching enhanced news...');
        loadingSpinner.style.display = 'flex';
        newsGrid.style.display = 'none';

        const response = await fetch(`${API_BASE_URL}/news/enhanced`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            mode: 'cors'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch news: ${response.status} ${response.statusText}`);
        }

        const responseData = await response.json();
        
        if (responseData.status !== 'success') {
            throw new Error(responseData.error?.message || 'Unknown error occurred');
        }
        
        // Store all stories globally
        allStories = responseData.data.stories;
        
        // Display the news
        displayNews(responseData);

    } catch (error) {
        console.error('Error fetching news:', error);
        loadingSpinner.style.display = 'none';
        newsGrid.innerHTML = `
            <div class="error-message">
                <h2>Något gick fel</h2>
                <p>Det gick inte att hämta nyheterna just nu. Försök igen senare.</p>
                <p class="error-details">${error.message}</p>
                <button onclick="fetchNews()" class="retry-button">Försök igen</button>
            </div>
        `;
    }
}

// Display news in the grid
function displayNews(responseData) {
    const newsGrid = document.querySelector('.news-grid');
    const loadingSpinner = document.querySelector('.loading-spinner');

    // Clear existing content
    newsGrid.innerHTML = '';

    // Update metadata
    updateMetadata(responseData.meta, responseData.data.lastUpdated);

    // Filter and display news based on active category
    filterAndDisplayNews();

    // Hide loading spinner and show news grid
    loadingSpinner.style.display = 'none';
    newsGrid.style.display = 'grid';
}

// Initialize the page
function init() {
    updateCurrentTime();
    setInterval(updateCurrentTime, 60000); // Update time every minute
    createCategoryButtons(); // Create category filter buttons
    fetchNews();
}

// Start the application
init(); 