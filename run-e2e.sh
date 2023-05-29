WK_DIR=/home/tester/workspace
mkdir $WK_DIR
cp . -r $WK_DIR/
cd $WK_DIR
npm i
npm run test:e2e
