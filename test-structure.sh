#!/bin/bash
# Crown HS Schedule Calendar - Structure Testing Script

echo "============================================"
echo "Crown HS Schedule Calendar - Structure Test"
echo "============================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Testing project structure..."
echo ""

# Test 1: index.html exists
if [ -f "index.html" ]; then
    echo -e "${GREEN}✅ index.html exists${NC}"
else
    echo -e "${RED}❌ index.html NOT found${NC}"
fi

# Test 2: app.js exists
if [ -f "js/app.js" ]; then
    echo -e "${GREEN}✅ js/app.js exists${NC}"
else
    echo -e "${RED}❌ js/app.js NOT found${NC}"
fi

# Test 3: styles.css exists
if [ -f "css/styles.css" ]; then
    echo -e "${GREEN}✅ css/styles.css exists${NC}"
else
    echo -e "${RED}❌ css/styles.css NOT found${NC}"
fi

# Test 4: Count components
component_count=$(find js/components -name "*.js" 2>/dev/null | wc -l | tr -d ' ')
if [ "$component_count" -eq 11 ]; then
    echo -e "${GREEN}✅ All 11 components found${NC}"
else
    echo -e "${YELLOW}⚠️  Found $component_count components (expected 11)${NC}"
fi

# Test 5: Count utilities
utils_count=$(find js/utils -name "*.js" 2>/dev/null | wc -l | tr -d ' ')
if [ "$utils_count" -eq 4 ]; then
    echo -e "${GREEN}✅ All 4 utilities found${NC}"
else
    echo -e "${YELLOW}⚠️  Found $utils_count utilities (expected 4)${NC}"
fi

# Test 6: Config exists
if [ -f "js/config/areaConfig.js" ]; then
    echo -e "${GREEN}✅ js/config/areaConfig.js exists${NC}"
else
    echo -e "${RED}❌ js/config/areaConfig.js NOT found${NC}"
fi

echo ""
echo "============================================"
echo "File Structure:"
echo "============================================"
echo ""

# List all JavaScript files
echo "JavaScript Files (17 total):"
find js -name "*.js" -type f | sort

echo ""
echo "============================================"
echo "Testing complete!"
echo "============================================"
echo ""
echo "To test the application:"
echo "1. cd /Users/lucioaguilar/crown-schedule-app"
echo "2. python3 -m http.server 8080"
echo "3. Open http://localhost:8080 in your browser"
echo ""
