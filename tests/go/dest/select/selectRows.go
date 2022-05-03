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

func (mrTable *PostAGType) SelectT(mrQueryable mingru.Queryable) ([]PostAGSelectTResult, error) {
	rows, err := mrQueryable.Query("SELECT `id`, `title` FROM `db_post` ORDER BY `id`")
	if err != nil {
		return nil, err
	}
	var result []PostAGSelectTResult
	defer rows.Close()
	for rows.Next() {
		var item PostAGSelectTResult
		err = rows.Scan(&item.ID, &item.Title)
		if err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}
	return result, nil
}
