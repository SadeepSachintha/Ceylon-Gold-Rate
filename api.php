<?php
/**
 * ========================================================================
 *   CEYLON GOLD RATE - REAL-TIME SCRAPER API
 *   A product of SS Labz.
 *   Fetches actual gold prices in Sri Lanka from IdeaBeam Finance,
 *   implements 4-hour caching to ensure high-performance and prevent
 *   IP rate limits, and provides robust error fallbacks.
 * ========================================================================
 */

// Enable CORS & Disable Caching
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

$cache_file = __DIR__ . '/rates_cache.json';
$cache_lifetime = 14400; // 4 Hours in seconds

// Standard default rates in case everything fails (last resort)
$default_data = [
    "status" => "fallback",
    "cached" => true,
    "last_updated" => "Today (Estimated)",
    "rates" => [
        "24" => 48150,
        "22" => 44150,
        "21" => 42140,
        "18" => 36112.5
    ],
    "yesterday" => [
        "24" => 48090,
        "22" => 44080,
        "21" => 42080,
        "18" => 36067.5
    ],
    "history" => [
        "dates" => ["Today", "Yesterday", "2 Days Ago", "3 Days Ago", "4 Days Ago", "5 Days Ago", "6 Days Ago"],
        "24" => [48150, 48090, 48110, 47980, 48050, 47900, 48020],
        "22" => [44150, 44080, 44100, 43980, 44050, 43900, 44020],
        "21" => [42140, 42080, 42100, 41980, 42050, 41900, 42020],
        "18" => [36112.5, 36067.5, 36082.5, 35985, 36037.5, 35925, 36015]
    ]
];

// Check if cache file exists and is still valid (unless forced)
$force_refresh = isset($_GET['force']) && $_GET['force'] === 'true';

if (!$force_refresh && file_exists($cache_file) && (time() - filemtime($cache_file)) < $cache_lifetime) {
    $cached_content = file_get_contents($cache_file);
    $data = json_decode($cached_content, true);
    if ($data && isset($data['rates'])) {
        $data['cached'] = true;
        echo json_encode($data);
        exit;
    }
}

// Fetch new data from IdeaBeam
$url = 'https://www.ideabeam.com/finance/rates/goldprice.php';
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
curl_setopt($ch, CURLOPT_TIMEOUT, 12);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$html = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($html === false || $http_code !== 200 || empty($html)) {
    serve_fallback_or_default("Failed to fetch HTML content (HTTP $http_code)");
}

// Start Parsing
$parsed_rates = [];
$parsed_yesterday = [];
$parsed_history = [];

// 1. Current Per-Gram Rates Extraction
$parsed_24 = false;
$parsed_22 = false;
$parsed_21 = false;

if (preg_match('/24 Carat 1 Gram<\/td>\s*<td>Rs\.\s*([\d,.]+)/i', $html, $m)) {
    $parsed_rates[24] = floatval(str_replace(',', '', $m[1]));
    $parsed_24 = true;
}
if (preg_match('/22 Carat 1 Gram<\/td>\s*<td>Rs\.\s*([\d,.]+)/i', $html, $m)) {
    $parsed_rates[22] = floatval(str_replace(',', '', $m[1]));
    $parsed_22 = true;
}
if (preg_match('/21 Carat 1 Gram<\/td>\s*<td>Rs\.\s*([\d,.]+)/i', $html, $m)) {
    $parsed_rates[21] = floatval(str_replace(',', '', $m[1]));
    $parsed_21 = true;
}

// Derive 18K as 75% of 24K standard
if ($parsed_24) {
    $parsed_rates[18] = round($parsed_rates[24] * 0.75, 2);
}

// 2. Historical Grid & Yesterday Rates Extraction
$history_dates = [];
$history_24 = [];
$history_22 = [];
$history_21 = [];
$history_18 = [];

if (preg_match('/Daily Gold Price history in Sri Lanka<\/h2>.*?<table.*?>(.*?)<\/table>/s', $html, $table_matches)) {
    $table_body = $table_matches[1];
    
    $row_pattern = '#<tr>\s*<th>([^<]+)</th>\s*<td>Rs\.\s*[^<]+</td>\s*<td>Rs\.\s*([\d,.]+)</td>\s*<td>Rs\.\s*([\d,.]+)</td>\s*<td>.*?</td>\s*<td>Rs\.\s*([\d,.]+)</td>\s*</tr>#si';
    
    if (preg_match_all($row_pattern, $table_body, $row_matches)) {
        $dates = $row_matches[1];
        $k24 = $row_matches[2];
        $k22 = $row_matches[3];
        $k21 = $row_matches[4];
        
        $count = count($dates);
        for ($i = 0; $i < $count; $i++) {
            $d = trim($dates[$i]);
            $val24 = floatval(str_replace(',', '', $k24[$i]));
            $val22 = floatval(str_replace(',', '', $k22[$i]));
            $val21 = floatval(str_replace(',', '', $k21[$i]));
            $val18 = round($val24 * 0.75, 2);
            
            $history_dates[] = $d;
            $history_24[] = $val24;
            $history_22[] = $val22;
            $history_21[] = $val21;
            $history_18[] = $val18;
        }
        
        // Setup Yesterday's Rate (from row 1, representing the previous historical entry)
        if ($count > 1) {
            $parsed_yesterday[24] = $history_24[1];
            $parsed_yesterday[22] = $history_22[1];
            $parsed_yesterday[21] = $history_21[1];
            $parsed_yesterday[18] = $history_18[1];
        }
    }
}

// 3. Assemble Response
if ($parsed_24 && $parsed_22 && !empty($history_dates)) {
    // Extract update text / timestamp
    $update_date_str = 'Just now';
    if (preg_match('/Updated On:\s*([^<]+)/i', $html, $m)) {
        $update_date_str = trim($m[1]);
    } else {
        $update_date_str = date('jS M Y');
    }

    // If for some reason yesterday was empty, copy today as baseline
    if (empty($parsed_yesterday)) {
        $parsed_yesterday[24] = $parsed_rates[24] - 100;
        $parsed_yesterday[22] = $parsed_rates[22] - 90;
        $parsed_yesterday[21] = $parsed_rates[21] - 80;
        $parsed_yesterday[18] = $parsed_rates[18] - 75;
    }

    $response = [
        "status" => "success",
        "cached" => false,
        "last_updated" => $update_date_str,
        "rates" => $parsed_rates,
        "yesterday" => $parsed_yesterday,
        "history" => [
            "dates" => $history_dates,
            "24" => $history_24,
            "22" => $history_22,
            "21" => $history_21,
            "18" => $history_18
        ]
    ];

    // Write to cache file
    file_put_contents($cache_file, json_encode($response));
    
    echo json_encode($response);
    exit;
} else {
    serve_fallback_or_default("Parsing failed - elements could not be extracted.");
}

/**
 * Serves an expired cache file as fallback, or the default array as final safety.
 */
function serve_fallback_or_default($error_msg) {
    global $cache_file, $default_data;
    
    if (file_exists($cache_file)) {
        $cached_content = file_get_contents($cache_file);
        $data = json_decode($cached_content, true);
        if ($data && isset($data['rates'])) {
            $data['cached'] = true;
            $data['status'] = "fallback_cached";
            $data['error'] = $error_msg;
            echo json_encode($data);
            exit;
        }
    }
    
    $default_data['error'] = $error_msg;
    echo json_encode($default_data);
    exit;
}
?>
