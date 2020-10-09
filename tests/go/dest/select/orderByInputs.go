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
	N     int
	Title string
}

// PostTableSelectTOrderBy1 ...
const {
	PostTableSelectTOrderBy1N = iota
	PostTableSelectTOrderBy1Title
	PostTableSelectTOrderBy1CmtC
}

// PostTableSelectTOrderBy2 ...
const {
	PostTableSelectTOrderBy2N = iota
	PostTableSelectTOrderBy2Title
}

// SelectT ...
func (da *TableTypePost) SelectT(queryable mingru.Queryable, id uint64, orderBy1 int, orderBy1Desc bool, orderBy2 int, orderBy2Desc bool) ([]*PostTableSelectTResult, error) {
	var orderBy1SQL string
	switch orderBy1 {
	case PostTableSelectTOrderBy1N:
		orderBy1SQL = "n"
	case PostTableSelectTOrderBy1Title:
		orderBy1SQL = "title"
	case PostTableSelectTOrderBy1CmtC:
		orderBy1SQL = "cmt_c"
	default:
		return nil, fmt.Errorf("Unsupported value %v", orderBy1)
	}
	if orderBy1Desc {
		orderBy1SQL += " DESC"
	}

	var orderBy2SQL string
	switch orderBy2 {
	case PostTableSelectTOrderBy2N:
		orderBy2SQL = "n"
	case PostTableSelectTOrderBy2Title:
		orderBy2SQL = "title"
	default:
		return nil, fmt.Errorf("Unsupported value %v", orderBy1)
	}
	if orderBy2Desc {
		orderBy2SQL += " DESC"
	}

	rows, err := queryable.Query("SELECT `id`, RAND() AS `n`, `title` FROM `db_post` WHERE `id` = ? ORDER BY `title`, "+orderBy1SQL+", "+orderBy2SQL+"", id)
	if err != nil {
		return nil, err
	}
	result := make([]*PostTableSelectTResult, 0)
	defer rows.Close()
	for rows.Next() {
		item := &PostTableSelectTResult{}
		err = rows.Scan(&item.ID, &item.N, &item.Title)
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
