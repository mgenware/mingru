package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

type PostAGT1Result struct {
	ID    uint64
	Title string
}

func (mrTable *PostAGType) T1(mrQueryable mingru.Queryable) (PostAGT1Result, error) {
	var result PostAGT1Result
	err := mrQueryable.QueryRow("SELECT `id`, `title` FROM `db_post` FOR UPDATE").Scan(&result.ID, &result.Title)
	if err != nil {
		return result, err
	}
	return result, nil
}

type PostAGT2Result struct {
	ID    uint64
	Title string
}

func (mrTable *PostAGType) T2(mrQueryable mingru.Queryable) (PostAGT2Result, error) {
	var result PostAGT2Result
	err := mrQueryable.QueryRow("SELECT `id`, `title` FROM `db_post` LOCK IN SHARE MODE").Scan(&result.ID, &result.Title)
	if err != nil {
		return result, err
	}
	return result, nil
}
