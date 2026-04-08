-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
);

-- Papers table
CREATE TABLE papers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(500) NOT NULL,
    authors TEXT,
    abstract TEXT,
    category VARCHAR(100),
    methodology VARCHAR(100),
    year INTEGER,
    file_url VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inverted index table
CREATE TABLE inverted_index (
    term VARCHAR(100) NOT NULL,
    paper_id INTEGER NOT NULL,
    frequency INTEGER NOT NULL,
    positions TEXT,  -- JSON string of positions
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
);

-- Search logs table
CREATE TABLE search_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword VARCHAR(255) NOT NULL,
    results_count INTEGER NOT NULL,
    searched_at DATETIME DEFAULT CURRENT_TIMESTAMP
); 
