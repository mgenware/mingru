package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// PostTableSelectTResult ...
type PostTableSelectTResult struct {
	ID    uint64
	Title string
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable mingru.Queryable, id uint64, title string) (*PostTableSelectTResult, error) {
	result := &PostTableSelectTResult{}
	err := queryable.QueryRow("SELECT `id`, `title` FROM `db_post` WHERE `id` = ? && `title` != ?", id, title).Scan(&result.ID, &result.Title)
	if err != nil {
		return nil, err
	}
	return result, nil
}
