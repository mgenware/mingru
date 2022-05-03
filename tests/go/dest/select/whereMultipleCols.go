package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

type PostAGSelectTResult struct {
	ID    uint64
	Title string
}

func (mrTable *PostAGType) SelectT(mrQueryable mingru.Queryable, id uint64, title string) (PostAGSelectTResult, error) {
	var result PostAGSelectTResult
	err := mrQueryable.QueryRow("SELECT `id`, `title` FROM `db_post` WHERE `id` = ? && `title` != ?", id, title).Scan(&result.ID, &result.Title)
	if err != nil {
		return result, err
	}
	return result, nil
}
