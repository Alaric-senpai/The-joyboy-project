#!/bin/bash

# JoyBoy Package Publishing Script
# This script builds and publishes all packages to npm

set -e  # Exit on any error

echo "🚀 JoyBoy Package Publishing"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if logged in to npm
echo -e "${BLUE}📋 Checking npm authentication...${NC}"
if ! npm whoami > /dev/null 2>&1; then
    echo -e "${RED}❌ Not logged in to npm. Please run 'npm login' first.${NC}"
    exit 1
fi

NPM_USER=$(npm whoami)
echo -e "${GREEN}✅ Logged in as: ${NPM_USER}${NC}"
echo ""

# Clean and build all packages
echo -e "${BLUE}🔨 Building all packages...${NC}"
pnpm build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# List packages to be published
echo -e "${BLUE}📦 Packages to be published:${NC}"
echo "  1. @joyboy-parser/types (1.1.0)"
echo "  2. @joyboy-parser/source-registry (1.1.0)"
echo "  3. @joyboy-parser/core (1.1.0)"
echo "  4. @joyboy-parser/source-mangadex (1.0.2)"
echo ""

# Confirm before publishing
read -p "$(echo -e ${YELLOW}Continue with publishing? [y/N]:${NC} )" -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Publishing cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}📤 Publishing packages...${NC}"
echo ""

# Publish in dependency order
PACKAGES=(
    "packages/types"
    "packages/source-registry"
    "packages/core"
    # "packages/sources/source-mangadex"
)

for package in "${PACKAGES[@]}"; do
    cd "$package"
    PACKAGE_NAME=$(node -p "require('./package.json').name")
    PACKAGE_VERSION=$(node -p "require('./package.json').version")
    
    echo -e "${BLUE}Publishing ${PACKAGE_NAME}@${PACKAGE_VERSION}...${NC}"
    
    # Check if version already exists
    if npm view "${PACKAGE_NAME}@${PACKAGE_VERSION}" version > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Version ${PACKAGE_VERSION} already published, skipping${NC}"
    else
        npm publish --access public
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Published ${PACKAGE_NAME}@${PACKAGE_VERSION}${NC}"
        else
            echo -e "${RED}❌ Failed to publish ${PACKAGE_NAME}${NC}"
            exit 1
        fi
    fi
    
    cd - > /dev/null
    echo ""
done

echo ""
echo -e "${GREEN}🎉 All packages published successfully!${NC}"
echo ""
echo -e "${BLUE}📦 Published versions:${NC}"
echo "  • @joyboy-parser/types@1.1.0"
echo "  • @joyboy-parser/source-registry@1.1.0"
echo "  • @joyboy-parser/core@1.1.0"
echo "  • @joyboy-parser/source-mangadex@1.0.2"
echo ""
echo -e "${BLUE}🔗 View on npm:${NC}"
echo "  • https://www.npmjs.com/package/@joyboy-parser/core"
echo "  • https://www.npmjs.com/package/@joyboy-parser/source-registry"
echo "  • https://www.npmjs.com/package/@joyboy-parser/types"
echo "  • https://www.npmjs.com/package/@joyboy-parser/source-mangadex"
echo ""
echo -e "${GREEN}✨ Done!${NC}"
