# MarioVMario
A game using genetic algorithms to create the perfect Mario.

Marios will continuously fall from the pipes and fight to the death. More accurately, they'll probably just walk around or jump. Marios are scored by how long they lived and how many other Marios they stomped. New Marios are created by breeding from the top 10 all time.

## Execution
A working version of this is up at http://test.aleonard.corp.he.net/mariovmario/index.html. Otherwise, clone this repo and open index.html in your browser.

## Code Changes
Older browsers didn't load multiple scripts correctly, so all .js files need to be bundled into one include. If you change any of them, reassemble with the following commands
```
cd js
g++ jsAssemble.cpp -o jsAssemble
./jsAssemble
```
