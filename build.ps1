cargo build --target wasm32-unknown-unknown --release
cp .\target\wasm32-unknown-unknown\release\asyncify_demo_rs.wasm .\
wasm-opt --asyncify -O4 asyncify_demo_rs.wasm -o asyncify_demo_rs.wasm
wasm2wat -f --generate-names asyncify_demo_rs.wasm -o asyncify_demo_rs.wat
