package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (da *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

// PostTableT1Result ...
type PostTableT1Result struct {
	ID    uint64
	Title string
}

// T1 ...
func (da *TableTypePost) T1(queryable mingru.Queryable) (PostTableT1Result, error) {
	var result PostTableT1Result
	err := queryable.QueryRow("SELECT `id`, `title` FROM `db_post` FOR UPDATE").Scan(&result.ID, &result.Title)
	if err != nil {
		return result, err
	}
	return result, nil
}

// PostTableT2Result ...
type PostTableT2Result struct {
	ID    uint64
	Title string
}

// T2 ...
func (da *TableTypePost) T2(queryable mingru.Queryable) (PostTableT2Result, error) {
	var result PostTableT2Result
	err := queryable.QueryRow("SELECT `id`, `title` FROM `db_post` LOCK IN SHARE MODE").Scan(&result.ID, &result.Title)
	if err != nil {
		return result, err
	}
	return result, nil
}
