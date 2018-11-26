package main

import (
	"log"
	"mingru-go-example/da"
)

func main() {
	conn, err := da.GetConn()
	if err != nil {
		panic(err)
	}
	res, err := da.Post.SelectT(conn)
	if err != nil {
		panic(err)
	}
	log.Print(res)
}
