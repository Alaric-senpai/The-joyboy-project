echo "navigating to types directory"
cd packages/types

echo "publishing types"
npm publish --access public

echo "publishing source-registry"
npm publish --access public


echo "navigating to core directory"
cd ../core

echo "publishing core"
npm publish --access public

echo "navigating to source-registry directory"
cd ../source-registry


echo "navigating to source-template directory"
cd ../source-template

echo "publishing source-template"
npm publish --access public