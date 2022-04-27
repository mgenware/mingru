package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) SelectT(mrQueryable mingru.Queryable, id uint64) (uint64, error) {
	var result uint64
	err := mrQueryable.QueryRow("SELECT `user_id` FROM `db_post` WHERE `id` = ?", id).Scan(&result)
	if err != nil {
		return result, err
	}
	return result, nil
}
