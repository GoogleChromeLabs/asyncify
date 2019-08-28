rustc --target wasm32-unknown-unknown --crate-type cdylib -O test.rs
wasm-opt -O2 --asyncify test.wasm -o test.wasm
