package da

import "github.com/mgenware/mingru-go-lib"

type TableTypePost struct {
}

var Post = &TableTypePost{}

// ------------ Actions ------------

type PostTableT1Result struct {
	ID    uint64
	Title string
}

func (mrTable *TableTypePost) T1(mrQueryable mingru.Queryable) (PostTableT1Result, error) {
	var result PostTableT1Result
	err := mrQueryable.QueryRow("SELECT `id`, `title` FROM `db_post` FOR UPDATE").Scan(&result.ID, &result.Title)
	if err != nil {
		return result, err
	}
	return result, nil
}

type PostTableT2Result struct {
	ID    uint64
	Title string
}

func (mrTable *TableTypePost) T2(mrQueryable mingru.Queryable) (PostTableT2Result, error) {
	var result PostTableT2Result
	err := mrQueryable.QueryRow("SELECT `id`, `title` FROM `db_post` LOCK IN SHARE MODE").Scan(&result.ID, &result.Title)
	if err != nil {
		return result, err
	}
	return result, nil
}
